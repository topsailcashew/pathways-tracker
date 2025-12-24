import React, { useState, useRef } from 'react';
import { IoCloudUploadOutline, IoCloseOutline, IoCheckmarkCircleOutline, IoWarningOutline, IoDownloadOutline } from 'react-icons/io5';
import * as membersApi from '../api/members';
import { useToast } from './Toast';

interface CSVRow {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    pathway?: 'NEWCOMER' | 'NEW_BELIEVER';
    status?: 'ACTIVE' | 'INACTIVE';
}

interface ValidationError {
    row: number;
    field: string;
    message: string;
}

interface CSVImportProps {
    isOpen: boolean;
    onClose: () => void;
    onImportComplete: () => void;
}

export const CSVImport: React.FC<CSVImportProps> = ({ isOpen, onClose, onImportComplete }) => {
    const { showSuccess, showError } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<CSVRow[]>([]);
    const [errors, setErrors] = useState<ValidationError[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        if (!selectedFile.name.endsWith('.csv')) {
            showError('Please select a CSV file');
            return;
        }

        setFile(selectedFile);
        parseCSV(selectedFile);
    };

    const parseCSV = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const lines = text.split('\n').filter(line => line.trim());

            if (lines.length < 2) {
                showError('CSV file is empty or has no data rows');
                return;
            }

            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            const rows: CSVRow[] = [];
            const validationErrors: ValidationError[] = [];

            // Validate headers
            const requiredHeaders = ['firstname', 'lastname'];
            const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
            if (missingHeaders.length > 0) {
                showError(`Missing required columns: ${missingHeaders.join(', ')}`);
                return;
            }

            // Parse rows
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
                const row: any = {};

                headers.forEach((header, index) => {
                    row[header] = values[index] || '';
                });

                // Validate required fields
                if (!row.firstname) {
                    validationErrors.push({
                        row: i + 1,
                        field: 'firstName',
                        message: 'First name is required',
                    });
                }
                if (!row.lastname) {
                    validationErrors.push({
                        row: i + 1,
                        field: 'lastName',
                        message: 'Last name is required',
                    });
                }

                // Validate email format
                if (row.email && !isValidEmail(row.email)) {
                    validationErrors.push({
                        row: i + 1,
                        field: 'email',
                        message: 'Invalid email format',
                    });
                }

                // Map to expected format
                const csvRow: CSVRow = {
                    firstName: row.firstname || '',
                    lastName: row.lastname || '',
                    email: row.email || undefined,
                    phone: row.phone || undefined,
                    pathway: row.pathway?.toUpperCase() === 'NEW_BELIEVER' ? 'NEW_BELIEVER' : 'NEWCOMER',
                    status: row.status?.toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
                };

                rows.push(csvRow);
            }

            setPreview(rows.slice(0, 10)); // Show first 10 rows
            setErrors(validationErrors);
        };

        reader.readAsText(file);
    };

    const isValidEmail = (email: string): boolean => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleImport = async () => {
        if (!file || preview.length === 0) return;

        if (errors.length > 0) {
            showError(`Please fix ${errors.length} validation error(s) before importing`);
            return;
        }

        setIsProcessing(true);
        setProgress({ current: 0, total: preview.length });

        let successCount = 0;
        let failCount = 0;

        // Read full file again
        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target?.result as string;
            const lines = text.split('\n').filter(line => line.trim());
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
                const row: any = {};

                headers.forEach((header, index) => {
                    row[header] = values[index] || '';
                });

                const memberData = {
                    firstName: row.firstname,
                    lastName: row.lastname,
                    email: row.email || undefined,
                    phone: row.phone || undefined,
                    pathway: row.pathway?.toUpperCase() === 'NEW_BELIEVER' ? 'NEW_BELIEVER' : 'NEWCOMER',
                    status: row.status?.toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
                };

                try {
                    await membersApi.createMember(memberData as any);
                    successCount++;
                } catch (error) {
                    console.error(`Failed to import row ${i + 1}:`, error);
                    failCount++;
                }

                setProgress({ current: i, total: lines.length - 1 });
            }

            setIsProcessing(false);

            if (successCount > 0) {
                showSuccess(`Successfully imported ${successCount} member(s)${failCount > 0 ? `, ${failCount} failed` : ''}`);
                onImportComplete();
                handleClose();
            } else {
                showError(`Failed to import all ${failCount} member(s)`);
            }
        };

        reader.readAsText(file);
    };

    const handleClose = () => {
        setFile(null);
        setPreview([]);
        setErrors([]);
        setProgress({ current: 0, total: 0 });
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        onClose();
    };

    const downloadTemplate = () => {
        const template = `firstName,lastName,email,phone,pathway,status
John,Doe,john@example.com,555-1234,NEWCOMER,ACTIVE
Jane,Smith,jane@example.com,555-5678,NEW_BELIEVER,ACTIVE`;

        const blob = new Blob([template], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'members-import-template.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                            <IoCloudUploadOutline className="text-blue-600" />
                            Import Members from CSV
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Upload a CSV file with member information
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600"
                        disabled={isProcessing}
                    >
                        <IoCloseOutline size={28} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Template Download */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className="font-medium text-blue-900">Need a template?</p>
                                <p className="text-sm text-blue-700 mt-1">
                                    Download our CSV template with the correct format
                                </p>
                            </div>
                            <button
                                onClick={downloadTemplate}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                <IoDownloadOutline />
                                Download Template
                            </button>
                        </div>
                    </div>

                    {/* File Upload */}
                    {!file && (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                            <IoCloudUploadOutline size={64} className="mx-auto text-gray-400 mb-4" />
                            <p className="text-lg font-medium text-gray-700 mb-2">
                                Drop your CSV file here or click to browse
                            </p>
                            <p className="text-sm text-gray-500 mb-4">
                                Required columns: firstName, lastName
                            </p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                onChange={handleFileSelect}
                                className="hidden"
                                id="csv-upload"
                            />
                            <label
                                htmlFor="csv-upload"
                                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                            >
                                Select File
                            </label>
                        </div>
                    )}

                    {/* Preview */}
                    {file && preview.length > 0 && (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">
                                    Preview ({preview.length} rows shown)
                                </h3>
                                <button
                                    onClick={() => {
                                        setFile(null);
                                        setPreview([]);
                                        setErrors([]);
                                        if (fileInputRef.current) {
                                            fileInputRef.current.value = '';
                                        }
                                    }}
                                    className="text-sm text-gray-600 hover:text-gray-800"
                                >
                                    Choose different file
                                </button>
                            </div>

                            {/* Errors */}
                            {errors.length > 0 && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                    <div className="flex items-start gap-3">
                                        <IoWarningOutline size={24} className="text-red-600 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="font-medium text-red-900">
                                                {errors.length} validation error(s) found
                                            </p>
                                            <ul className="mt-2 space-y-1 text-sm text-red-700">
                                                {errors.slice(0, 5).map((error, index) => (
                                                    <li key={index}>
                                                        Row {error.row}: {error.message} ({error.field})
                                                    </li>
                                                ))}
                                                {errors.length > 5 && (
                                                    <li className="text-red-600">...and {errors.length - 5} more</li>
                                                )}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Table */}
                            <div className="border border-gray-200 rounded-lg overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">First Name</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Name</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pathway</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {preview.map((row, index) => (
                                            <tr key={index}>
                                                <td className="px-4 py-3 text-sm">{row.firstName}</td>
                                                <td className="px-4 py-3 text-sm">{row.lastName}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{row.email || '-'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{row.phone || '-'}</td>
                                                <td className="px-4 py-3 text-sm">
                                                    <span className={`px-2 py-1 rounded text-xs ${
                                                        row.pathway === 'NEW_BELIEVER' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                        {row.pathway}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    <span className={`px-2 py-1 rounded text-xs ${
                                                        row.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                                    }`}>
                                                        {row.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Progress */}
                    {isProcessing && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                <span className="text-sm font-medium text-blue-800">
                                    Importing... {progress.current} of {progress.total}
                                </span>
                            </div>
                            <div className="w-full bg-blue-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex justify-end gap-3">
                    <button
                        onClick={handleClose}
                        className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                        disabled={isProcessing}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={isProcessing || !file || preview.length === 0 || errors.length > 0}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                Importing...
                            </>
                        ) : (
                            <>
                                <IoCheckmarkCircleOutline size={20} />
                                Import Members
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CSVImport;
