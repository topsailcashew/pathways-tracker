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
        <label className="text-xs font-bold text-gray-500 uppercase">{label}</label>
        <input type={type} value={value} onChange={onChange} placeholder={placeholder} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
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
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                    <IoCloudDownloadOutline className="text-primary" /> Integrations
                </h1>
                <p className="text-sm text-gray-500 mt-1">Connect external data sources and import people into pathways.</p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3">
                <button onClick={() => setShowCSVImport(true)} className="flex items-center gap-2 text-sm font-bold bg-primary text-white px-4 py-2.5 rounded-xl hover:bg-primary/90 shadow-lg">
                    <IoDocumentTextOutline size={16} /> Import CSV
                </button>
                <button onClick={() => setIsAddingIntegration(true)} className="flex items-center gap-2 text-sm font-bold bg-green-600 text-white px-4 py-2.5 rounded-xl hover:bg-green-700 shadow-lg">
                    <IoAddOutline size={16} /> New Google Sheet Connection
                </button>
            </div>

            {/* Existing Integrations */}
            <div className="space-y-4">
                {integrations.map((config) => (
                    <div key={config.id} className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center text-2xl shrink-0"><IoLogoGoogle /></div>
                            <div>
                                <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                    {config.sourceName}
                                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase tracking-wide">Active</span>
                                </h4>
                                <p className="text-xs text-gray-500 mt-1 truncate max-w-xs">{config.sheetUrl}</p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                    <span>Map to: <strong className="text-gray-700">{getStageName(config.targetStageId)}</strong></span>
                                    {config.lastSync && <span>Synced: {new Date(config.lastSync).toLocaleString()}</span>}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <button onClick={() => triggerSync(config)} disabled={syncingId === config.id} className="flex-1 md:flex-none flex items-center justify-center gap-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                                <IoSyncOutline className={syncingId === config.id ? "animate-spin" : ""} /> {syncingId === config.id ? 'Syncing...' : 'Sync Now'}
                            </button>
                            <button onClick={() => handleDeleteIntegration(config.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><IoTrashOutline size={18} /></button>
                        </div>
                    </div>
                ))}
                {integrations.length === 0 && !isAddingIntegration && (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300 shadow-sm">
                        <IoCloudDownloadOutline className="mx-auto text-gray-300 mb-3" size={32} />
                        <p className="text-gray-500">No integrations configured yet.</p>
                        <p className="text-xs text-gray-400 mt-1">Connect a Google Sheet or import a CSV to get started.</p>
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
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm animate-fade-in">
                    <h4 className="font-bold text-gray-800 mb-4">Connect New Google Sheet</h4>
                    <div className="mb-6 bg-blue-50 text-blue-800 p-4 rounded-lg text-xs border border-blue-100 flex items-start gap-2">
                        <IoInformationCircleOutline size={20} className="shrink-0" />
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
                        <button onClick={handleAddIntegration} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold">Save Connection</button>
                        <button onClick={() => setIsAddingIntegration(false)} className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-bold">Cancel</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IntegrationsPage;
