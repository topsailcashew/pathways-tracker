import React, { useState } from 'react';
import {
    IoAddOutline, IoTrashOutline, IoCloudDownloadOutline, IoLogoGoogle, IoSyncOutline,
    IoInformationCircleOutline, IoDocumentTextOutline
} from 'react-icons/io5';
import { PathwayType, IntegrationConfig } from '../types';
import { useAppContext } from '../context/AppContext';
import CSVImportModal from './CSVImportModal';

const InputField = ({ label, value, onChange, placeholder, type = 'text', className = '' }: any) => (
    <div className={`space-y-1 ${className}`}>
        <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960] block mb-1.5">{label}</label>
        <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="bg-white border border-[#D8D2C2] rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[rgba(46,102,229,0.20)] focus:border-[#FCA311]"
        />
    </div>
);

const IntegrationsPage: React.FC = () => {
    const {
        newcomerStages, newBelieverStages,
        integrations, setIntegrations, syncIntegration
    } = useAppContext();

    const [showCSVImport, setShowCSVImport] = useState(false);
    const [isAddingIntegration, setIsAddingIntegration] = useState(false);
    const [newInt, setNewInt] = useState<Partial<IntegrationConfig>>({
        sourceName: '', sheetUrl: '', targetPathway: PathwayType.NEWCOMER, targetStageId: newcomerStages[0]?.id,
        autoCreateTask: true, taskDescription: 'Follow up with new sign-up: [Member Name]', autoWelcome: true
    });
    const [syncingId, setSyncingId] = useState<string | null>(null);

    const getStageName = (id: string) => [...newcomerStages, ...newBelieverStages].find(s => s.id === id)?.name || 'Unknown';

    const handleAddIntegration = () => {
        if (!newInt.sourceName || !newInt.sheetUrl) return;
        const integration: IntegrationConfig = {
            id: `int-${Date.now()}`, sourceName: newInt.sourceName, sheetUrl: newInt.sheetUrl,
            targetPathway: newInt.targetPathway || PathwayType.NEWCOMER,
            targetStageId: newInt.targetStageId || newcomerStages[0]?.id || '',
            autoCreateTask: newInt.autoCreateTask || false, taskDescription: newInt.taskDescription || '',
            autoWelcome: newInt.autoWelcome || false, lastSync: null, status: 'ACTIVE'
        };
        setIntegrations([...integrations, integration]);
        setIsAddingIntegration(false);
        setNewInt({ sourceName: '', sheetUrl: '', targetPathway: PathwayType.NEWCOMER, targetStageId: newcomerStages[0]?.id, autoCreateTask: true, taskDescription: 'Follow up...', autoWelcome: true });
    };

    const handleDeleteIntegration = (id: string) => {
        if (window.confirm('Remove integration?')) setIntegrations(integrations.filter(i => i.id !== id));
    };

    const triggerSync = async (config: IntegrationConfig) => {
        setSyncingId(config.id);
        try { await syncIntegration(config); } catch (e: any) { alert(e.message); }
        setSyncingId(null);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <div>
                <h1 className="text-[2.125rem] font-bold tracking-tight text-[#14213D]">Integrations</h1>
                <p className="text-sm text-[#6B6960] mt-1">Connect external data sources and import people into pathways.</p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => setShowCSVImport(true)}
                    className="bg-[#14213D] text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-[#1F2D52] transition-colors flex items-center gap-2"
                >
                    <IoDocumentTextOutline size={16} /> Import CSV
                </button>
                <button
                    onClick={() => setIsAddingIntegration(true)}
                    className="bg-white border border-[#D8D2C2] text-[#14213D] rounded-lg px-4 py-2 text-sm font-semibold hover:bg-[#FAF8F4] transition-colors flex items-center gap-2"
                >
                    <IoAddOutline size={16} /> New Google Sheet Connection
                </button>
            </div>

            {/* Existing Integrations */}
            <div className="space-y-4">
                {integrations.map((config) => (
                    <div key={config.id} className="bg-white rounded-2xl border border-[#E5E0D2] shadow-sm p-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[#FAF8F4] flex items-center justify-center text-2xl text-[#4F7E50] shrink-0">
                                <IoLogoGoogle />
                            </div>
                            <div>
                                <h4 className="font-semibold text-[#14213D] flex items-center gap-2">
                                    {config.sourceName}
                                    <span className="flex items-center gap-1 text-xs text-[#4F7E50] font-semibold">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#4F7E50] inline-block" />
                                        Connected
                                    </span>
                                </h4>
                                <p className="text-xs text-[#6B6960] mt-1 truncate max-w-xs">{config.sheetUrl}</p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-[#6B6960]">
                                    <span>Map to: <strong className="text-[#1F2D52]">{getStageName(config.targetStageId)}</strong></span>
                                    {config.lastSync && <span>Synced: {new Date(config.lastSync).toLocaleString()}</span>}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <button
                                onClick={() => triggerSync(config)}
                                disabled={syncingId === config.id}
                                className="flex-1 md:flex-none bg-white border border-[#D8D2C2] text-[#14213D] rounded-lg px-4 py-2 text-sm font-semibold hover:bg-[#FAF8F4] transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                            >
                                <IoSyncOutline className={syncingId === config.id ? 'animate-spin' : ''} />
                                {syncingId === config.id ? 'Syncing...' : 'Sync Now'}
                            </button>
                            <button
                                onClick={() => handleDeleteIntegration(config.id)}
                                className="p-2 text-[#9E9D95] hover:text-[#B42626] hover:bg-[#FBE5E5] rounded-lg transition-colors"
                            >
                                <IoTrashOutline size={18} />
                            </button>
                        </div>
                    </div>
                ))}
                {integrations.length === 0 && !isAddingIntegration && (
                    <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-[#D8D2C2] shadow-sm">
                        <IoCloudDownloadOutline className="mx-auto text-[#9E9D95] mb-3" size={32} />
                        <p className="text-[#6B6960]">No integrations configured yet.</p>
                        <p className="text-xs text-[#9E9D95] mt-1">Connect a Google Sheet or import a CSV to get started.</p>
                    </div>
                )}
            </div>

            {/* CSV Import Modal */}
            {showCSVImport && (
                <CSVImportModal
                    onClose={() => setShowCSVImport(false)}
                    onComplete={() => setShowCSVImport(false)}
                />
            )}

            {/* Add Integration Form */}
            {isAddingIntegration && (
                <div className="bg-white rounded-2xl border border-[#E5E0D2] shadow-sm p-6 animate-fade-in">
                    <h4 className="font-semibold text-[#14213D] mb-4">Connect New Google Sheet</h4>
                    <div className="mb-6 bg-[#FEECD0] text-[#B8732A] p-4 rounded-lg text-xs border border-[#FCA311]/20 flex items-start gap-2">
                        <IoInformationCircleOutline size={20} className="shrink-0 text-[#B8732A]" />
                        <div>
                            <p className="font-bold mb-1">Important: Requires "Publish to Web"</p>
                            <p>To allow this app to read your Google Sheet directly, publish it as CSV.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <InputField label="Source Name" value={newInt.sourceName} onChange={(e: any) => setNewInt({...newInt, sourceName: e.target.value})} placeholder="e.g. Newcomers Lunch Signup" />
                        <InputField label="Google Sheet URL" value={newInt.sheetUrl} onChange={(e: any) => setNewInt({...newInt, sheetUrl: e.target.value})} placeholder="https://..." />
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleAddIntegration}
                            className="bg-[#14213D] text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-[#1F2D52] transition-colors"
                        >
                            Save Connection
                        </button>
                        <button
                            onClick={() => setIsAddingIntegration(false)}
                            className="bg-white border border-[#D8D2C2] text-[#14213D] rounded-lg px-4 py-2 text-sm font-semibold hover:bg-[#FAF8F4] transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IntegrationsPage;
