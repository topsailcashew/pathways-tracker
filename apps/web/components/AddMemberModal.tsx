
import React, { useState, useRef } from 'react';
import { IoCloseOutline, IoPersonAddOutline, IoCloudUploadOutline, IoDownloadOutline, IoDocumentTextOutline, IoAlertCircleOutline, IoCheckmarkCircleOutline } from 'react-icons/io5';
import { Member, MemberStatus, PathwayType, Stage, ChurchSettings, MessageLog } from '../types';
import { sendEmail } from '../services/communicationService';
import { parseCSV } from '../services/ingestionService';
import { createMember } from '../src/api/members';

interface AddMemberModalProps {
  onClose: () => void;
  onAddMembers: (members: Member[]) => void;
  newcomerStages: Stage[];
  newBelieverStages: Stage[];
  churchSettings: ChurchSettings;
  existingMembers: Member[];
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({ onClose, onAddMembers, newcomerStages, newBelieverStages, churchSettings, existingMembers }) => {
  const [activeTab, setActiveTab] = useState<'SINGLE' | 'CSV'>('SINGLE');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Single Entry State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    pathway: PathwayType.NEWCOMER,
    gender: 'Male'
  });

  // CSV State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [parsedCount, setParsedCount] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Handlers for Single Entry ---
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName) return;

    // Basic Duplicate Check for Single Entry
    const isDuplicate = existingMembers.some(m =>
        (m.email && formData.email && m.email.toLowerCase() === formData.email.toLowerCase()) ||
        (m.firstName.toLowerCase() === formData.firstName.toLowerCase() && m.lastName.toLowerCase() === formData.lastName.toLowerCase())
    );

    if (isDuplicate) {
        if (!window.confirm("A member with this Name or Email already exists. Add anyway?")) {
            return;
        }
    }

    setIsProcessing(true);
    try {
      const stages = formData.pathway === PathwayType.NEWCOMER ? newcomerStages : newBelieverStages;
      const initialStageId = stages[0]?.id;
      if (!initialStageId) {
        alert('No stages configured for this pathway. Please add stages in Settings first.');
        setIsProcessing(false);
        return;
      }

      // Map frontend PathwayType enum to API string
      const pathwayMap: Record<string, 'NEWCOMER' | 'NEW_BELIEVER'> = {
        [PathwayType.NEWCOMER]: 'NEWCOMER',
        [PathwayType.NEW_BELIEVER]: 'NEW_BELIEVER',
      };

      const apiPathway = pathwayMap[formData.pathway] || 'NEWCOMER';

      const apiResult = await createMember({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        pathway: apiPathway as 'NEWCOMER' | 'NEW_BELIEVER',
        currentStageId: initialStageId,
      });

      // Convert API result to frontend Member format
      const newMember: Member = {
        id: apiResult.id,
        firstName: apiResult.firstName,
        lastName: apiResult.lastName,
        email: apiResult.email || '',
        phone: apiResult.phone || '',
        photoUrl: `https://ui-avatars.com/api/?name=${apiResult.firstName}+${apiResult.lastName}&background=random`,
        pathway: formData.pathway,
        currentStageId: apiResult.stageId || initialStageId,
        status: MemberStatus.ACTIVE,
        joinedDate: (apiResult.createdAt ? apiResult.createdAt.split('T')[0] : null) || new Date().toISOString().split('T')[0],
        assignedToId: '',
        tags: [],
        notes: [],
        messageLog: [],
        resources: [],
        isChurchMember: false
      };

      onAddMembers([newMember]);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to add member. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Handlers for CSV ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "text/csv" && !file.name.endsWith('.csv')) {
        setCsvError("Please upload a valid CSV file.");
        setCsvFile(null);
        return;
      }
      setCsvFile(file);
      setCsvError(null);
      
      // Quick parse to count potential records
      const reader = new FileReader();
      reader.onload = (event) => {
          const text = event.target?.result as string;
          // Simple estimate for UI
          const lines = text.split('\n').filter(line => line.trim() !== '');
          setParsedCount(Math.max(0, lines.length - 1));
      };
      reader.readAsText(file);
    }
  };

  const processCSV = async () => {
    if (!csvFile) return;
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const parsedEntries = parseCSV(text); // Use shared robust parser
      
      const newMembers: Member[] = [];
      let duplicateCount = 0;
      let emailCount = 0;

      parsedEntries.forEach((entry, i) => {
        if(!entry) return;

        // Duplicate Check
        const existsInDb = existingMembers.some(m => m.email && m.email.toLowerCase() === entry.email.toLowerCase());
        const existsInBatch = newMembers.some(m => m.email && m.email.toLowerCase() === entry.email.toLowerCase());

        if (existsInDb || existsInBatch) {
            duplicateCount++;
            return; 
        }

        // Determine Pathway
        let pathway = PathwayType.NEWCOMER;
        if (entry.pathwayRaw && entry.pathwayRaw.toLowerCase().includes('believer')) {
            pathway = PathwayType.NEW_BELIEVER;
        }

        const stages = pathway === PathwayType.NEWCOMER ? newcomerStages : newBelieverStages;
        const initialStageId = stages[0]?.id || 'unknown';
        const timestamp = new Date().toISOString();
        const displayDate = new Date().toLocaleDateString();

        let initialNotes = [`[System] Imported via CSV on ${displayDate}`];
        let initialMessageLog: MessageLog[] = [];

        // Auto-Welcome Logic
        if (churchSettings.autoWelcome && entry.email && entry.email.includes('@')) {
             const welcomeSubject = `Welcome to ${churchSettings.name}!`;
             const welcomeBody = `Hi ${entry.firstName},\n\nWe are so glad you joined us at ${churchSettings.name}! We look forward to seeing you again soon.\n\nBest,\nThe Team`;
             
             sendEmail(entry.email, welcomeSubject, welcomeBody);
             emailCount++;

             initialNotes.unshift(`[${new Date().toLocaleString()}] Auto-Welcome Email Sent`);
             initialMessageLog.push({
                 id: `wel-${Date.now()}-${i}`,
                 channel: 'EMAIL',
                 direction: 'OUTBOUND',
                 timestamp: timestamp,
                 content: welcomeBody,
                 sentBy: 'System (Auto-Welcome)'
             });
        }

        newMembers.push({
            id: `imp-${Date.now()}-${i}`,
            firstName: entry.firstName,
            lastName: entry.lastName,
            email: entry.email,
            phone: entry.phone,
            photoUrl: `https://ui-avatars.com/api/?name=${entry.firstName}+${entry.lastName}&background=random`,
            pathway: pathway,
            currentStageId: initialStageId,
            status: MemberStatus.ACTIVE,
            joinedDate: timestamp.split('T')[0],
            assignedToId: '',
            tags: ['Imported'],
            notes: initialNotes,
            messageLog: initialMessageLog,
            resources: [],
            isChurchMember: false
        });
      });

      setIsProcessing(false);

      if (newMembers.length > 0 || duplicateCount > 0) {
          if (newMembers.length > 0) {
              onAddMembers(newMembers);
          }
          
          let message = `Import Result:\n`;
          if (newMembers.length > 0) message += `✅ Successfully imported ${newMembers.length} people.\n`;
          if (duplicateCount > 0) message += `⚠️ Skipped ${duplicateCount} duplicate records (by email).\n`;
          if (emailCount > 0) message += `📧 ${emailCount} welcome emails queued.\n`;
          
          alert(message);
          onClose();
      } else {
          setCsvError("No valid records found in CSV.");
      }
    };
    reader.readAsText(csvFile);
  };

  const downloadTemplate = () => {
      const headers = "First Name,Last Name,Email,Phone,Pathway";
      const example = "John,Doe,john@example.com,555-0123,Newcomer";
      const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + example;
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "people_import_template.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-background rounded-2xl shadow-2xl flex flex-col animate-zoom-in overflow-hidden">
        
        {/* Header */}
        <div className="bg-white p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <IoPersonAddOutline /> Add People
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <IoCloseOutline size={24} className="text-gray-500" />
            </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 bg-white">
            <button 
                onClick={() => setActiveTab('SINGLE')}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                    activeTab === 'SINGLE' ? 'text-primary border-b-2 border-primary bg-blue-50/50' : 'text-gray-500 hover:bg-gray-50'
                }`}
            >
                Single Entry
            </button>
            <button 
                onClick={() => setActiveTab('CSV')}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                    activeTab === 'CSV' ? 'text-primary border-b-2 border-primary bg-blue-50/50' : 'text-gray-500 hover:bg-gray-50'
                }`}
            >
                Bulk Import (CSV)
            </button>
        </div>

        <div className="p-6 bg-white">
            {activeTab === 'SINGLE' ? (
                <form onSubmit={handleSingleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">First Name <span className="text-red-500">*</span></label>
                            <input 
                                required
                                type="text"
                                value={formData.firstName}
                                onChange={e => setFormData({...formData, firstName: e.target.value})}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                                placeholder="e.g. John"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Last Name <span className="text-red-500">*</span></label>
                            <input 
                                required
                                type="text"
                                value={formData.lastName}
                                onChange={e => setFormData({...formData, lastName: e.target.value})}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                                placeholder="e.g. Doe"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Email Address</label>
                        <input 
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                            placeholder="john.doe@example.com"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Phone Number</label>
                        <input 
                            type="tel"
                            value={formData.phone}
                            onChange={e => setFormData({...formData, phone: e.target.value})}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                            placeholder="(555) 000-0000"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Pathway</label>
                        <select 
                            value={formData.pathway}
                            onChange={e => setFormData({...formData, pathway: e.target.value as PathwayType})}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                        >
                            <option value={PathwayType.NEWCOMER}>Newcomer Pathway</option>
                            <option value={PathwayType.NEW_BELIEVER}>New Believer Pathway</option>
                        </select>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50">
                            Cancel
                        </button>
                        <button type="submit" className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-navy shadow-lg shadow-primary/20">
                            Add Person
                        </button>
                    </div>
                </form>
            ) : (
                <div className="space-y-6">
                    <div 
                        className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-primary hover:bg-blue-50/10 transition-colors cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            className="hidden"
                            accept=".csv"
                            onChange={handleFileChange}
                        />
                        <div className="w-16 h-16 bg-blue-50 text-primary rounded-full flex items-center justify-center mb-4">
                            <IoCloudUploadOutline size={32} />
                        </div>
                        {csvFile ? (
                            <div>
                                <p className="font-bold text-gray-800">{csvFile.name}</p>
                                <p className="text-xs text-green-600 font-bold mt-1 flex items-center justify-center gap-1">
                                    <IoCheckmarkCircleOutline size={14} /> Ready to import (~{parsedCount} records)
                                </p>
                            </div>
                        ) : (
                            <div>
                                <p className="font-bold text-gray-800">Click to upload CSV</p>
                                <p className="text-sm text-gray-500 mt-1">or drag and drop file here</p>
                            </div>
                        )}
                    </div>

                    {csvError && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-start gap-2">
                            <IoAlertCircleOutline className="shrink-0 mt-0.5" size={16} />
                            {csvError}
                        </div>
                    )}
                    
                    {churchSettings.autoWelcome && (
                        <div className="px-3 py-2 bg-blue-50 text-primary text-xs rounded-lg border border-blue-100 flex items-center gap-2">
                            <IoCheckmarkCircleOutline />
                            <span>Auto-Welcome enabled: Valid emails will receive a welcome message.</span>
                        </div>
                    )}

                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex justify-between items-center mb-2">
                             <h4 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                                 <IoDocumentTextOutline /> CSV Format Guide
                             </h4>
                             <button onClick={downloadTemplate} className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
                                 <IoDownloadOutline /> Download Template
                             </button>
                        </div>
                        <p className="text-xs text-gray-600 font-mono bg-white p-2 rounded border border-gray-200">
                            First Name, Last Name, Email, Phone, Pathway
                        </p>
                        <p className="text-[10px] text-gray-400 mt-2">
                            * Pathway should be 'Newcomer' or 'New Believer'. Default is Newcomer.
                        </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50">
                            Cancel
                        </button>
                        <button 
                            type="button" 
                            onClick={processCSV}
                            disabled={!csvFile || isProcessing}
                            className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-navy shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isProcessing ? (
                                <>
                                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                                    Processing...
                                </>
                            ) : 'Import People'}
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default AddMemberModal;
