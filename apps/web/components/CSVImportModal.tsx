import React, { useState, useEffect, useCallback } from 'react';
import {
  IoCloudUploadOutline,
  IoArrowBackOutline,
  IoArrowForwardOutline,
  IoCheckmarkCircleOutline,
  IoWarningOutline,
  IoCloseOutline,
  IoChevronDownOutline,
  IoChevronUpOutline,
} from 'react-icons/io5';
import { MEMBER_FIELDS } from '../constants/memberFields';
import { getStages, Stage } from '../src/api/stages';
import { importMembers, ImportMemberRow } from '../src/api/members';
import type { MemberMapField } from '../types';

type ImportStep = 'UPLOAD' | 'MAP_COLUMNS' | 'CONFIGURE' | 'PREVIEW' | 'IMPORTING' | 'RESULTS';

interface CSVImportModalProps {
  onClose: () => void;
  onComplete: () => void;
}

// CSV parsing helper (same logic as ingestionService.ts)
function splitCSVLine(str: string): string[] {
  const arr: string[] = [];
  let quote = false;
  let col = '';
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (c === '"') {
      quote = !quote;
      continue;
    }
    if (c === ',' && !quote) {
      arr.push(col);
      col = '';
      continue;
    }
    col += c;
  }
  arr.push(col);
  return arr;
}

// Heuristic matching of CSV header to member field key
function autoMatchHeader(header: string): MemberMapField | '' {
  const h = header.toLowerCase().trim();

  for (const field of MEMBER_FIELDS) {
    if (h === field.key.toLowerCase()) return field.key;
  }
  for (const field of MEMBER_FIELDS) {
    if (h === field.label.toLowerCase()) return field.key;
  }

  // Heuristic partial matches
  const heuristics: Record<string, MemberMapField> = {
    'first_name': 'firstName',
    'first name': 'firstName',
    'fname': 'firstName',
    'given name': 'firstName',
    'last_name': 'lastName',
    'last name': 'lastName',
    'lname': 'lastName',
    'surname': 'lastName',
    'family name': 'lastName',
    'email_address': 'email',
    'email address': 'email',
    'e-mail': 'email',
    'phone_number': 'phone',
    'phone number': 'phone',
    'mobile': 'phone',
    'cell': 'phone',
    'cell phone': 'phone',
    'telephone': 'phone',
    'dob': 'dateOfBirth',
    'date_of_birth': 'dateOfBirth',
    'birth date': 'dateOfBirth',
    'birthday': 'dateOfBirth',
    'street': 'address',
    'street address': 'address',
    'address line': 'address',
    'postal code': 'zip',
    'postal_code': 'zip',
    'zipcode': 'zip',
    'zip code': 'zip',
    'zip_code': 'zip',
    'postcode': 'zip',
    'province': 'state',
    'state/province': 'state',
    'country': 'nationality',
    'marital_status': 'maritalStatus',
    'marital status': 'maritalStatus',
    'spouse_name': 'spouseName',
    'spouse name': 'spouseName',
    'spouse_dob': 'spouseDob',
    'spouse date of birth': 'spouseDob',
    'emergency_contact': 'emergencyContact',
    'emergency contact': 'emergencyContact',
    'church_member': 'isChurchMember',
    'church member': 'isChurchMember',
    'tithe_number': 'titheNumber',
    'tithe number': 'titheNumber',
  };

  if (heuristics[h]) return heuristics[h];

  // Partial substring matches as last resort
  if (h.includes('first') && h.includes('name')) return 'firstName';
  if (h.includes('last') && h.includes('name')) return 'lastName';
  if (h.includes('email')) return 'email';
  if (h.includes('phone') || h.includes('mobile') || h.includes('cell')) return 'phone';
  if (h.includes('gender') || h.includes('sex')) return 'gender';
  if (h.includes('city') || h.includes('town')) return 'city';
  if (h.includes('state') || h.includes('province')) return 'state';
  if (h.includes('zip') || h.includes('postal')) return 'zip';
  if (h.includes('address') || h.includes('street')) return 'address';

  return '';
}

const CSVImportModal: React.FC<CSVImportModalProps> = ({ onClose, onComplete }) => {
  const [step, setStep] = useState<ImportStep>('UPLOAD');
  const [error, setError] = useState<string | null>(null);

  // UPLOAD state
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);

  // MAP_COLUMNS state
  const [columnMap, setColumnMap] = useState<Record<number, MemberMapField | ''>>({});

  // CONFIGURE state
  const [pathway, setPathway] = useState<'NEWCOMER' | 'NEW_BELIEVER'>('NEWCOMER');
  const [stageId, setStageId] = useState('');
  const [stages, setStages] = useState<Stage[]>([]);
  const [loadingStages, setLoadingStages] = useState(false);

  // RESULTS state
  const [result, setResult] = useState<{ created: number; skipped: number; errors: { row: number; firstName: string; lastName: string; reason: string }[] } | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  // Load stages when pathway changes
  useEffect(() => {
    const load = async () => {
      setLoadingStages(true);
      try {
        const s = await getStages(pathway);
        setStages(s.sort((a, b) => a.order - b.order));
      } catch {
        setStages([]);
      } finally {
        setLoadingStages(false);
      }
    };
    load();
  }, [pathway]);

  // Reset stage when pathway changes
  useEffect(() => {
    setStageId('');
  }, [pathway]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);

      if (lines.length < 2) {
        setError('CSV file must contain a header row and at least one data row');
        return;
      }

      const parsedHeaders = splitCSVLine(lines[0]!).map(h => h.trim().replace(/^["']+|["']+$/g, ''));
      const parsedRows = lines.slice(1).map(line =>
        splitCSVLine(line).map(v => v.trim().replace(/^["']+|["']+$/g, ''))
      );

      setHeaders(parsedHeaders);
      setRows(parsedRows);

      // Auto-match columns
      const autoMap: Record<number, MemberMapField | ''> = {};
      const usedFields = new Set<string>();
      for (let i = 0; i < parsedHeaders.length; i++) {
        const match = autoMatchHeader(parsedHeaders[i]!);
        if (match && !usedFields.has(match)) {
          autoMap[i] = match;
          usedFields.add(match);
        } else {
          autoMap[i] = '';
        }
      }
      setColumnMap(autoMap);
      setStep('MAP_COLUMNS');
    };
    reader.readAsText(file);
  }, []);

  const handleMapChange = (colIndex: number, fieldKey: MemberMapField | '') => {
    setColumnMap(prev => {
      const next = { ...prev };
      // If this field is already used by another column, clear it
      if (fieldKey) {
        for (const key of Object.keys(next)) {
          if (next[Number(key)] === fieldKey && Number(key) !== colIndex) {
            next[Number(key)] = '';
          }
        }
      }
      next[colIndex] = fieldKey;
      return next;
    });
  };

  const isMappingValid = () => {
    const mappedFields = Object.values(columnMap).filter(Boolean);
    return mappedFields.includes('firstName') && mappedFields.includes('lastName');
  };

  const buildMappedRows = (): ImportMemberRow[] => {
    return rows.map(row => {
      const member: Record<string, any> = {};
      for (let i = 0; i < headers.length; i++) {
        const field = columnMap[i];
        if (field && row[i]) {
          if (field === 'isChurchMember') {
            const v = row[i]!.toLowerCase();
            member[field] = v === 'true' || v === 'yes' || v === '1';
          } else {
            member[field] = row[i];
          }
        }
      }
      return member as ImportMemberRow;
    }).filter(m => m.firstName && m.lastName);
  };

  const handleImport = async () => {
    setStep('IMPORTING');
    setError(null);
    try {
      const mappedRows = buildMappedRows();
      const BATCH_SIZE = 500;

      if (mappedRows.length <= BATCH_SIZE) {
        const res = await importMembers({
          members: mappedRows,
          pathway,
          currentStageId: stageId,
        });
        setResult(res);
      } else {
        // Chunk into batches
        const totals = { created: 0, skipped: 0, errors: [] as { row: number; firstName: string; lastName: string; reason: string }[] };
        for (let i = 0; i < mappedRows.length; i += BATCH_SIZE) {
          const batch = mappedRows.slice(i, i + BATCH_SIZE);
          const res = await importMembers({
            members: batch,
            pathway,
            currentStageId: stageId,
          });
          totals.created += res.created;
          totals.skipped += res.skipped;
          // Offset row numbers by batch start index
          totals.errors.push(...res.errors.map(e => ({ ...e, row: e.row + i })));
        }
        setResult(totals);
      }
      setStep('RESULTS');
    } catch (err: any) {
      setError(err.message || 'Import failed');
      setStep('PREVIEW');
    }
  };

  const handleDone = () => {
    if (result && result.created > 0) {
      onComplete();
    }
    onClose();
  };

  const mappedFields = Object.values(columnMap).filter(Boolean);
  const previewRows = buildMappedRows().slice(0, 5);
  const totalValid = buildMappedRows().length;
  const previewColumns = MEMBER_FIELDS.filter(f => mappedFields.includes(f.key));

  return (
    <div className="bg-[#FAF8F4] border border-[#E5E0D2] rounded-2xl p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h4 className="font-bold text-[#14213D] text-lg">Import Members from CSV</h4>
        <button onClick={onClose} className="p-1.5 text-[#9E9D95] hover:text-[#14213D] rounded-lg hover:bg-[#EFEBE0] transition-colors">
          <IoCloseOutline size={20} />
        </button>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-6">
        {(['UPLOAD', 'MAP_COLUMNS', 'CONFIGURE', 'PREVIEW'] as ImportStep[]).map((s, i) => {
          const labels = ['Upload', 'Map Columns', 'Configure', 'Preview'];
          const stepOrder = ['UPLOAD', 'MAP_COLUMNS', 'CONFIGURE', 'PREVIEW', 'IMPORTING', 'RESULTS'];
          const currentIdx = stepOrder.indexOf(step);
          const thisIdx = i;
          const isActive = currentIdx === thisIdx;
          const isDone = currentIdx > thisIdx;
          return (
            <React.Fragment key={s}>
              {i > 0 && <div className={`flex-1 h-px ${isDone ? 'bg-[#4F7E50]' : 'bg-black/[0.10]'}`} />}
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                isActive ? 'bg-[#FEECD0] text-[#B8732A]' :
                isDone ? 'bg-[#EFEBE0] text-[#4F7E50]' :
                'bg-white border border-[#E5E0D2] text-[#9E9D95]'
              }`}>
                {isDone && <IoCheckmarkCircleOutline size={14} />}
                {labels[i]}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {error && (
        <div className="bg-[#FBE5E5] border border-[#B42626]/20 text-[#B42626] rounded-lg px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      {/* UPLOAD Step */}
      {step === 'UPLOAD' && (
        <div className="border-2 border-dashed border-[#D8D2C2] rounded-xl p-8 bg-[#FAF8F4] hover:bg-[#EFEBE0] text-center transition-colors">
          <IoCloudUploadOutline className="mx-auto text-[#9E9D95] mb-4" size={48} />
          <p className="text-[#1F2D52] mb-4">Select a CSV file to import members</p>
          <label className="inline-flex items-center gap-2 bg-[#14213D] text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-[#1F2D52] transition-colors cursor-pointer">
            <IoCloudUploadOutline size={16} />
            Choose CSV File
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          <p className="text-xs text-[#9E9D95] mt-3">Supports large CSV files with automatic batching</p>
        </div>
      )}

      {/* MAP_COLUMNS Step */}
      {step === 'MAP_COLUMNS' && (
        <div>
          <p className="text-sm text-[#6B6960] mb-4">
            Map your CSV columns to member fields. <strong>First Name</strong> and <strong>Last Name</strong> are required.
            {fileName && <span className="text-[#9E9D95] ml-2">({fileName} - {rows.length} rows)</span>}
          </p>
          <div className="max-h-96 overflow-y-auto border border-[#E5E0D2] rounded-xl bg-white">
            <table className="w-full text-sm">
              <thead className="bg-[#FAF8F4] sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960]">CSV Column</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960]">Sample Value</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960]">Map To Field</th>
                </tr>
              </thead>
              <tbody>
                {headers.map((header, i) => (
                  <tr key={i} className="border-t border-[#E5E0D2] hover:bg-[#FAF8F4] transition-colors">
                    <td className="px-4 py-2.5 font-medium text-[#14213D]">{header}</td>
                    <td className="px-4 py-2.5 text-[#9E9D95] truncate max-w-[200px]">{rows[0]?.[i] || '—'}</td>
                    <td className="px-4 py-2.5">
                      <select
                        value={columnMap[i] || ''}
                        onChange={(e) => handleMapChange(i, e.target.value as MemberMapField | '')}
                        className={`w-full px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:border-[#FCA311] ${
                          columnMap[i] ? 'border-[#4F7E50]/40 bg-[#EFEBE0]/30' : 'border-[#D8D2C2] bg-white'
                        }`}
                      >
                        <option value="">— Skip —</option>
                        {MEMBER_FIELDS.map(f => {
                          const isUsed = Object.values(columnMap).includes(f.key) && columnMap[i] !== f.key;
                          return (
                            <option key={f.key} value={f.key} disabled={isUsed}>
                              {f.label}{isUsed ? ' (already mapped)' : ''}
                            </option>
                          );
                        })}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!isMappingValid() && (
            <div className="bg-[#FEECD0] border border-[#B8732A]/20 text-[#B8732A] px-4 py-2 rounded-lg text-xs mt-3 flex items-center gap-2">
              <IoWarningOutline size={16} />
              You must map both First Name and Last Name to proceed.
            </div>
          )}

          <div className="flex justify-between mt-4">
            <button
              onClick={() => { setStep('UPLOAD'); setHeaders([]); setRows([]); setFileName(''); }}
              className="flex items-center gap-1 px-4 py-2 text-[#6B6960] hover:text-[#14213D] text-sm font-medium transition-colors"
            >
              <IoArrowBackOutline size={14} /> Back
            </button>
            <button
              onClick={() => setStep('CONFIGURE')}
              disabled={!isMappingValid()}
              className="flex items-center gap-1 bg-[#14213D] text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-[#1F2D52] transition-colors disabled:opacity-50"
            >
              Next <IoArrowForwardOutline size={14} />
            </button>
          </div>
        </div>
      )}

      {/* CONFIGURE Step */}
      {step === 'CONFIGURE' && (
        <div>
          <p className="text-sm text-[#6B6960] mb-4">
            Choose which pathway and stage these members will be placed in.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960] block mb-1.5">Pathway</label>
              <select
                value={pathway}
                onChange={(e) => setPathway(e.target.value as 'NEWCOMER' | 'NEW_BELIEVER')}
                className="bg-white border border-[#D8D2C2] rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[rgba(46,102,229,0.20)] focus:border-[#FCA311]"
              >
                <option value="NEWCOMER">Newcomer</option>
                <option value="NEW_BELIEVER">New Believer</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960] block mb-1.5">Starting Stage</label>
              <select
                value={stageId}
                onChange={(e) => setStageId(e.target.value)}
                disabled={loadingStages}
                className="bg-white border border-[#D8D2C2] rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[rgba(46,102,229,0.20)] focus:border-[#FCA311] disabled:opacity-50"
              >
                <option value="">{loadingStages ? 'Loading stages...' : 'Select a stage...'}</option>
                {stages.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {stageId && (
            <div className="bg-[#FAF8F4] border border-[#E5E0D2] rounded-lg p-3 mb-4">
              <p className="text-xs text-[#1F2D52]">
                {totalValid} members will be imported into the{' '}
                <strong>{pathway === 'NEWCOMER' ? 'Newcomer' : 'New Believer'}</strong>{' '}
                pathway at the{' '}
                <strong>{stages.find(s => s.id === stageId)?.name}</strong>{' '}
                stage.
              </p>
            </div>
          )}

          <div className="flex justify-between mt-4">
            <button
              onClick={() => setStep('MAP_COLUMNS')}
              className="flex items-center gap-1 px-4 py-2 text-[#6B6960] hover:text-[#14213D] text-sm font-medium transition-colors"
            >
              <IoArrowBackOutline size={14} /> Back
            </button>
            <button
              onClick={() => setStep('PREVIEW')}
              disabled={!stageId}
              className="flex items-center gap-1 bg-[#14213D] text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-[#1F2D52] transition-colors disabled:opacity-50"
            >
              Preview <IoArrowForwardOutline size={14} />
            </button>
          </div>
        </div>
      )}

      {/* PREVIEW Step */}
      {step === 'PREVIEW' && (
        <div>
          <p className="text-sm text-[#6B6960] mb-4">
            Showing first {Math.min(5, previewRows.length)} of <strong>{totalValid}</strong> rows to import.
          </p>
          <div className="overflow-x-auto border border-[#E5E0D2] rounded-xl mb-4 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-[#FAF8F4]">
                <tr>
                  <th className="text-left px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960]">#</th>
                  {previewColumns.map(f => (
                    <th key={f.key} className="text-left px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960]">{f.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, i) => (
                  <tr key={i} className="border-t border-[#E5E0D2] hover:bg-[#FAF8F4] transition-colors">
                    <td className="px-3 py-2.5 text-[#9E9D95]">{i + 1}</td>
                    {previewColumns.map(f => (
                      <td key={f.key} className="px-3 py-2.5 text-[#14213D] truncate max-w-[150px]">
                        {(row as any)[f.key] || '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-[#FAF8F4] border border-[#E5E0D2] rounded-lg p-3 mb-4 text-xs text-[#6B6960]">
            <strong>{totalValid}</strong> rows will be imported into{' '}
            <strong>{pathway === 'NEWCOMER' ? 'Newcomer' : 'New Believer'}</strong> pathway,{' '}
            <strong>{stages.find(s => s.id === stageId)?.name}</strong> stage.
            {rows.length > totalValid && (
              <span className="text-[#B8732A] ml-1">
                ({rows.length - totalValid} rows skipped due to missing name fields)
              </span>
            )}
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep('CONFIGURE')}
              className="flex items-center gap-1 px-4 py-2 text-[#6B6960] hover:text-[#14213D] text-sm font-medium transition-colors"
            >
              <IoArrowBackOutline size={14} /> Back
            </button>
            <button
              onClick={handleImport}
              className="flex items-center gap-2 bg-[#4F7E50] text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-[#255f40] transition-colors"
            >
              <IoCloudUploadOutline size={16} /> Import {totalValid} Members
            </button>
          </div>
        </div>
      )}

      {/* IMPORTING Step */}
      {step === 'IMPORTING' && (
        <div className="text-center py-12">
          <div className="inline-block w-10 h-10 border-4 border-[#14213D] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-[#1F2D52] font-medium">Importing members...</p>
          <p className="text-xs text-[#9E9D95] mt-1">This may take a moment for large imports.</p>
        </div>
      )}

      {/* RESULTS Step */}
      {step === 'RESULTS' && result && (
        <div>
          <div className="text-center py-6">
            <IoCheckmarkCircleOutline className="mx-auto text-[#4F7E50] mb-3" size={48} />
            <h4 className="text-lg font-bold text-[#14213D] mb-2">Import Complete</h4>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-white border border-[#E5E0D2] rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-[#4F7E50]">{result.created}</p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960] mt-1">Created</p>
            </div>
            <div className="bg-white border border-[#E5E0D2] rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-[#B8732A]">{result.skipped}</p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960] mt-1">Skipped</p>
            </div>
            <div className="bg-white border border-[#E5E0D2] rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-[#B42626]">{result.errors.length}</p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960] mt-1">Errors</p>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="mb-4">
              <button
                onClick={() => setShowErrors(!showErrors)}
                className="flex items-center gap-1 text-sm text-[#B42626] hover:text-[#8B1A1A] font-medium transition-colors"
              >
                {showErrors ? <IoChevronUpOutline size={14} /> : <IoChevronDownOutline size={14} />}
                {showErrors ? 'Hide' : 'Show'} error details ({result.errors.length})
              </button>
              {showErrors && (
                <div className="mt-2 max-h-48 overflow-y-auto border border-[#B42626]/20 rounded-xl bg-white">
                  <table className="w-full text-xs">
                    <thead className="bg-[#FBE5E5] sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-1.5 text-[#B42626]">Row</th>
                        <th className="text-left px-3 py-1.5 text-[#B42626]">Name</th>
                        <th className="text-left px-3 py-1.5 text-[#B42626]">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.errors.map((err, i) => (
                        <tr key={i} className="border-t border-[#B42626]/10">
                          <td className="px-3 py-1.5 text-[#6B6960]">{err.row}</td>
                          <td className="px-3 py-1.5 text-[#14213D]">{err.firstName} {err.lastName}</td>
                          <td className="px-3 py-1.5 text-[#B42626]">{err.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleDone}
              className="bg-[#14213D] text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-[#1F2D52] transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CSVImportModal;
