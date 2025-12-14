
import React, { useState, useRef } from 'react';
import { 
    IoAddOutline, IoTrashOutline, IoPencilOutline, IoArrowUpOutline, 
    IoArrowDownOutline, IoSaveOutline, IoCloseOutline, IoReorderTwoOutline,
    IoBusinessOutline, IoGitNetworkOutline, IoPeopleOutline, IoNotificationsOutline,
    IoGlobeOutline, IoCallOutline, IoMailOutline, IoLocationOutline, IoTimeOutline, IoFlashOutline, IoCloudDownloadOutline, IoLogoGoogle, IoSyncOutline, IoCheckmarkCircleOutline, IoInformationCircleOutline
} from 'react-icons/io5';
import { Stage, PathwayType, ChurchSettings, ServiceTime, AutomationRule, IntegrationConfig, TaskPriority } from '../types';

interface SettingsPageProps {
  newcomerStages: Stage[];
  setNewcomerStages: (stages: Stage[]) => void;
  newBelieverStages: Stage[];
  setNewBelieverStages: (stages: Stage[]) => void;
  churchSettings: ChurchSettings;
  setChurchSettings: (settings: ChurchSettings) => void;
  automationRules: AutomationRule[];
  setAutomationRules: (rules: AutomationRule[]) => void;
  integrations?: IntegrationConfig[];
  setIntegrations?: (configs: IntegrationConfig[]) => void;
  onSyncIntegration?: (config: IntegrationConfig) => Promise<void>;
}

// Reusable Components to reduce redundancy
const InputField = ({ label, value, onChange, placeholder, type = 'text', className = '' }: any) => (
    <div className={`space-y-1 ${className}`}>
        <label className="text-xs font-bold text-gray-500 uppercase">{label}</label>
        <input 
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary"
        />
    </div>
);

const SelectField = ({ label, value, onChange, options, children }: any) => (
    <div className="space-y-1">
        <label className="text-xs font-bold text-gray-500 uppercase">{label}</label>
        <select 
            value={value}
            onChange={onChange}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary"
        >
            {children || options?.map((opt: any) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    </div>
);

const SettingsPage: React.FC<SettingsPageProps> = ({
  newcomerStages,
  setNewcomerStages,
  newBelieverStages,
  setNewBelieverStages,
  churchSettings,
  setChurchSettings,
  automationRules,
  setAutomationRules,
  integrations = [],
  setIntegrations = () => {},
  onSyncIntegration = async () => {}
}) => {
  const [activeSection, setActiveSection] = useState<'GENERAL' | 'PATHWAYS' | 'TEAM' | 'NOTIFICATIONS' | 'AUTOMATION' | 'INTEGRATIONS'>('GENERAL');
  
  // -- Pathways State --
  const [activePathwayTab, setActivePathwayTab] = useState<PathwayType>(PathwayType.NEWCOMER);
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [newStageName, setNewStageName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const dragItem = useRef<number | null>(null);

  // -- Service Time State --
  const [newService, setNewService] = useState<Partial<ServiceTime>>({ day: 'Sunday', time: '09:00', name: '' });

  // -- Integration State --
  const [isAddingIntegration, setIsAddingIntegration] = useState(false);
  const [newInt, setNewInt] = useState<Partial<IntegrationConfig>>({
      sourceName: '',
      sheetUrl: '',
      targetPathway: PathwayType.NEWCOMER,
      targetStageId: newcomerStages[0]?.id,
      autoCreateTask: true,
      taskDescription: 'Follow up with new sign-up: [Member Name]',
      autoWelcome: true
  });
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // -- Automation State --
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [newRule, setNewRule] = useState<Partial<AutomationRule>>({
      stageId: newcomerStages[0]?.id || '',
      taskDescription: '',
      daysDue: 2,
      priority: TaskPriority.MEDIUM,
      enabled: true
  });

  // -- Team Mock Data --
  const [teamMembers] = useState([
      { id: 1, name: 'Sarah Shepard', role: 'Admin', email: 'sarah.shepard@church.org', avatar: 'https://picsum.photos/id/64/100/100' },
      { id: 2, name: 'Mike Johnson', role: 'Volunteer', email: 'mike.j@church.org', avatar: 'https://picsum.photos/id/32/100/100' },
      { id: 3, name: 'Elena Rodriguez', role: 'Volunteer', email: 'elena.r@church.org', avatar: 'https://picsum.photos/id/45/100/100' },
  ]);

  // -- General Settings Handlers --
  const handleSettingChange = (field: keyof ChurchSettings, value: any) => {
    setChurchSettings({ ...churchSettings, [field]: value });
  };

  const handleAddService = () => {
    if (!newService.time || !newService.name) return;
    const service: ServiceTime = {
        id: `st-${Date.now()}`,
        day: newService.day || 'Sunday',
        time: newService.time,
        name: newService.name
    };
    handleSettingChange('serviceTimes', [...churchSettings.serviceTimes, service]);
    setNewService({ day: 'Sunday', time: '', name: '' });
  };

  const handleDeleteService = (id: string) => {
      handleSettingChange('serviceTimes', churchSettings.serviceTimes.filter(st => st.id !== id));
  };

  // -- Pathways Logic --
  const currentStages = activePathwayTab === PathwayType.NEWCOMER ? newcomerStages : newBelieverStages;
  const setStages = activePathwayTab === PathwayType.NEWCOMER ? setNewcomerStages : setNewBelieverStages;

  const handleUpdateOrder = (stagesToUpdate: Stage[]) => {
    const reordered = stagesToUpdate.map((s, idx) => ({ ...s, order: idx + 1 }));
    setStages(reordered);
  };

  const moveStage = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === currentStages.length - 1) return;
    const newStages = [...currentStages];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newStages[index], newStages[swapIndex]] = [newStages[swapIndex], newStages[index]];
    handleUpdateOrder(newStages);
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    dragItem.current = index;
    setDraggingIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (dragItem.current === null || dragItem.current === index) return;
    const newStages = [...currentStages];
    const draggedStage = newStages[dragItem.current];
    newStages.splice(dragItem.current, 1);
    newStages.splice(index, 0, draggedStage);
    dragItem.current = index;
    setDraggingIndex(index);
    handleUpdateOrder(newStages);
  };

  const handleDragEnd = () => { dragItem.current = null; setDraggingIndex(null); };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  const handleAddStage = () => {
    if (!newStageName.trim()) return;
    const newId = (activePathwayTab === PathwayType.NEWCOMER ? 'nc' : 'nb') + Date.now();
    handleUpdateOrder([...currentStages, { id: newId, name: newStageName, order: currentStages.length + 1 }]);
    setNewStageName('');
    setIsAdding(false);
  };

  const handleDeleteStage = (id: string) => {
    if (window.confirm('Are you sure you want to delete this stage?')) {
      handleUpdateOrder(currentStages.filter(s => s.id !== id));
    }
  };

  const startEditing = (stage: Stage) => { setEditingStageId(stage.id); setEditName(stage.name); };
  const saveEdit = () => {
    if (!editName.trim()) return;
    setStages(currentStages.map(s => s.id === editingStageId ? { ...s, name: editName } : s));
    setEditingStageId(null);
  };

  // -- Automation Handlers --
  const toggleRule = (id: string) => {
      setAutomationRules(automationRules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const handleAddRule = () => {
    if (!newRule.taskDescription || !newRule.stageId) return;
    
    const rule: AutomationRule = {
        id: `ar-${Date.now()}`,
        stageId: newRule.stageId,
        taskDescription: newRule.taskDescription,
        daysDue: newRule.daysDue || 2,
        priority: newRule.priority || TaskPriority.MEDIUM,
        enabled: true
    };
    
    setAutomationRules([...automationRules, rule]);
    setIsAddingRule(false);
    setNewRule({
        stageId: newcomerStages[0]?.id || '',
        taskDescription: '',
        daysDue: 2,
        priority: TaskPriority.MEDIUM,
        enabled: true
    });
  };

  const handleDeleteRule = (id: string) => {
      if(window.confirm('Delete this automation rule?')) {
          setAutomationRules(automationRules.filter(r => r.id !== id));
      }
  };

  const getStageName = (id: string) => {
      const s = [...newcomerStages, ...newBelieverStages].find(s => s.id === id);
      return s ? s.name : 'Unknown Stage';
  };

  // -- Integration Handlers --
  const handleAddIntegration = () => {
    if(!newInt.sourceName || !newInt.sheetUrl) return;

    const integration: IntegrationConfig = {
        id: `int-${Date.now()}`,
        sourceName: newInt.sourceName,
        sheetUrl: newInt.sheetUrl,
        targetPathway: newInt.targetPathway || PathwayType.NEWCOMER,
        targetStageId: newInt.targetStageId || newcomerStages[0].id,
        autoCreateTask: newInt.autoCreateTask || false,
        taskDescription: newInt.taskDescription || '',
        autoWelcome: newInt.autoWelcome || false,
        lastSync: null,
        status: 'ACTIVE'
    };

    setIntegrations([...integrations, integration]);
    setIsAddingIntegration(false);
    setNewInt({ 
        sourceName: '', sheetUrl: '', targetPathway: PathwayType.NEWCOMER, 
        targetStageId: newcomerStages[0].id, autoCreateTask: true, taskDescription: 'Follow up...', autoWelcome: true 
    });
  };

  const handleDeleteIntegration = (id: string) => {
      if(window.confirm('Remove this integration?')) {
          setIntegrations(integrations.filter(i => i.id !== id));
      }
  };

  const triggerSync = async (config: IntegrationConfig) => {
      setSyncingId(config.id);
      try {
          await onSyncIntegration(config);
      } catch (e: any) {
          alert(e.message);
      }
      setSyncingId(null);
  };

  // --- RENDER CONTENT SECTIONS ---

  const renderGeneralSettings = () => (
      <div className="space-y-8 animate-fade-in pb-10">
          <div>
              <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2 mb-4">Church Identity</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Church Name</label>
                      <div className="relative">
                          <IoBusinessOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input 
                            type="text" 
                            value={churchSettings.name} 
                            onChange={e => handleSettingChange('name', e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          />
                      </div>
                  </div>
                   <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Denomination</label>
                      <input 
                        type="text" 
                        value={churchSettings.denomination} 
                        onChange={e => handleSettingChange('denomination', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        placeholder="e.g. Non-Denominational, Baptist..."
                      />
                  </div>
              </div>
          </div>
      </div>
  );

  const renderIntegrationsSettings = () => (
      <div className="space-y-6 animate-fade-in">
          <div className="flex justify-between items-center border-b border-gray-100 pb-4">
            <div>
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <IoCloudDownloadOutline /> External Integrations
                </h3>
                <p className="text-sm text-gray-500 mt-1">Connect Google Sheets to auto-import people into pathways.</p>
            </div>
            {!isAddingIntegration && (
                <button 
                    onClick={() => setIsAddingIntegration(true)}
                    className="flex items-center gap-2 text-sm font-bold bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 shadow-lg shadow-green-600/20"
                >
                    <IoAddOutline size={16} /> New Connection
                </button>
            )}
          </div>

          <div className="space-y-4">
              {integrations.map(config => (
                  <div key={config.id} className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                      <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center text-2xl shrink-0">
                              <IoLogoGoogle />
                          </div>
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
                          <button 
                            onClick={() => triggerSync(config)}
                            disabled={syncingId === config.id}
                            className="flex-1 md:flex-none flex items-center justify-center gap-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                          >
                              <IoSyncOutline className={syncingId === config.id ? "animate-spin" : ""} />
                              {syncingId === config.id ? 'Syncing...' : 'Sync Now'}
                          </button>
                          <button 
                            onClick={() => handleDeleteIntegration(config.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                          >
                              <IoTrashOutline size={18} />
                          </button>
                      </div>
                  </div>
              ))}

              {integrations.length === 0 && !isAddingIntegration && (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                      <IoCloudDownloadOutline className="mx-auto text-gray-300 mb-3" size={32} />
                      <p className="text-gray-500">No integrations configured.</p>
                  </div>
              )}
          </div>

          {isAddingIntegration && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 animate-fade-in">
                  <h4 className="font-bold text-gray-800 mb-4">Connect New Sheet</h4>
                  
                  {/* Warning Box */}
                  <div className="mb-6 bg-blue-50 text-blue-800 p-4 rounded-lg text-xs border border-blue-100 flex items-start gap-2">
                      <IoInformationCircleOutline size={20} className="shrink-0" />
                      <div>
                          <p className="font-bold mb-1">Important: Requires "Publish to Web"</p>
                          <p>To allow this app to read your Google Sheet directly, publish it as CSV (File &gt; Share &gt; Publish to web).</p>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <InputField 
                          label="Source Name"
                          value={newInt.sourceName}
                          onChange={(e: any) => setNewInt({...newInt, sourceName: e.target.value})}
                          placeholder="e.g. Newcomers Lunch Signup"
                      />
                      <InputField 
                          label="Google Sheet URL"
                          value={newInt.sheetUrl}
                          onChange={(e: any) => setNewInt({...newInt, sheetUrl: e.target.value})}
                          placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv"
                      />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                       <SelectField 
                          label="Target Pathway"
                          value={newInt.targetPathway}
                          onChange={(e: any) => {
                              const p = e.target.value as PathwayType;
                              setNewInt({
                                  ...newInt, 
                                  targetPathway: p,
                                  targetStageId: p === PathwayType.NEWCOMER ? newcomerStages[0].id : newBelieverStages[0].id
                              });
                          }}
                       >
                            <option value={PathwayType.NEWCOMER}>Newcomer</option>
                            <option value={PathwayType.NEW_BELIEVER}>New Believer</option>
                       </SelectField>

                       <SelectField 
                          label="Map to Stage"
                          value={newInt.targetStageId}
                          onChange={(e: any) => setNewInt({...newInt, targetStageId: e.target.value})}
                       >
                            {(newInt.targetPathway === PathwayType.NEWCOMER ? newcomerStages : newBelieverStages).map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                       </SelectField>
                  </div>

                  <div className="space-y-3 mb-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={newInt.autoWelcome}
                            onChange={e => setNewInt({...newInt, autoWelcome: e.target.checked})}
                            className="rounded text-primary focus:ring-primary"
                          />
                          <span className="text-sm text-gray-700">Send Auto-Welcome Email</span>
                      </label>

                       <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={newInt.autoCreateTask}
                            onChange={e => setNewInt({...newInt, autoCreateTask: e.target.checked})}
                            className="rounded text-primary focus:ring-primary"
                          />
                          <span className="text-sm text-gray-700">Create Task for Team Leader</span>
                      </label>
                      
                      {newInt.autoCreateTask && (
                          <InputField 
                              value={newInt.taskDescription}
                              onChange={(e: any) => setNewInt({...newInt, taskDescription: e.target.value})}
                              placeholder="Task description..."
                              className="ml-6 max-w-md"
                          />
                      )}
                  </div>

                  <div className="flex gap-3">
                      <button onClick={handleAddIntegration} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold">Save Integration</button>
                      <button onClick={() => setIsAddingIntegration(false)} className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-bold">Cancel</button>
                  </div>
              </div>
          )}
      </div>
  );

  const renderPathwaySettings = () => (
    <div className="space-y-6 animate-fade-in">
       <div className="flex justify-between items-center border-b border-gray-100 pb-4">
            <div>
                <h3 className="text-xl font-bold text-gray-800">Pathway Configuration</h3>
                <p className="text-sm text-gray-500 mt-1">Customize the stages for your people flows.</p>
            </div>
       </div>

       {/* Tabs */}
       <div className="flex p-1 bg-gray-100 rounded-xl w-fit">
           <button 
                onClick={() => setActivePathwayTab(PathwayType.NEWCOMER)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activePathwayTab === PathwayType.NEWCOMER ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
           >
                Newcomer
           </button>
           <button 
                onClick={() => setActivePathwayTab(PathwayType.NEW_BELIEVER)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activePathwayTab === PathwayType.NEW_BELIEVER ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
           >
                New Believer
           </button>
       </div>

       <div className="space-y-3 max-w-2xl">
           {currentStages.map((stage, index) => (
               <div 
                    key={stage.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnter={(e) => handleDragEnter(e, index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    className={`bg-white border border-gray-200 p-4 rounded-xl flex items-center gap-4 group ${draggingIndex === index ? 'opacity-50 border-dashed border-primary' : ''}`}
               >
                   <button className="text-gray-400 cursor-grab active:cursor-grabbing hover:text-gray-600">
                       <IoReorderTwoOutline size={20} />
                   </button>
                   
                   <div className="w-8 h-8 bg-blue-50 text-primary rounded-full flex items-center justify-center font-bold text-sm">
                       {index + 1}
                   </div>

                   <div className="flex-1">
                       {editingStageId === stage.id ? (
                           <div className="flex items-center gap-2">
                               <input 
                                    autoFocus
                                    type="text" 
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary w-full"
                               />
                               <button onClick={saveEdit} className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200"><IoSaveOutline /></button>
                               <button onClick={() => setEditingStageId(null)} className="p-1.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"><IoCloseOutline /></button>
                           </div>
                       ) : (
                           <h4 className="font-bold text-gray-700">{stage.name}</h4>
                       )}
                   </div>

                   <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={() => startEditing(stage)} className="p-2 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50">
                           <IoPencilOutline size={16} />
                       </button>
                       <button onClick={() => handleDeleteStage(stage.id)} className="p-2 text-gray-400 hover:text-red-600 rounded hover:bg-red-50">
                           <IoTrashOutline size={16} />
                       </button>
                   </div>
               </div>
           ))}

           {isAdding ? (
               <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl flex items-center gap-4 animate-fade-in">
                   <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center font-bold text-sm text-gray-500">
                       {currentStages.length + 1}
                   </div>
                   <input 
                        autoFocus
                        type="text" 
                        value={newStageName}
                        onChange={(e) => setNewStageName(e.target.value)}
                        placeholder="Stage Name"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddStage()}
                   />
                   <button onClick={handleAddStage} className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-navy">Add</button>
                   <button onClick={() => setIsAdding(false)} className="px-3 py-2 text-gray-500 rounded-lg text-xs font-bold hover:bg-gray-200">Cancel</button>
               </div>
           ) : (
               <button 
                    onClick={() => setIsAdding(true)}
                    className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 font-bold text-sm hover:border-primary hover:text-primary hover:bg-blue-50/30 transition-all flex items-center justify-center gap-2"
               >
                   <IoAddOutline size={18} /> Add Stage
               </button>
           )}
       </div>
    </div>
  );

  const renderAutomationSettings = () => (
      <div className="space-y-6 animate-fade-in">
           <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-800">Automation Rules</h3>
                    <p className="text-sm text-gray-500 mt-1">Automatically create tasks when people move stages.</p>
                </div>
                {!isAddingRule && (
                    <button 
                        onClick={() => setIsAddingRule(true)}
                        className="flex items-center gap-2 text-sm font-bold bg-primary text-white px-4 py-2 rounded-xl hover:bg-navy shadow-lg shadow-primary/20"
                    >
                        <IoAddOutline size={16} /> New Rule
                    </button>
                )}
           </div>
           
           {isAddingRule && (
               <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-4 animate-fade-in">
                   <h4 className="font-bold text-gray-800 mb-4">Create New Automation Rule</h4>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                       <SelectField 
                          label="Trigger Stage"
                          value={newRule.stageId}
                          onChange={(e: any) => setNewRule({...newRule, stageId: e.target.value})}
                       >
                            <optgroup label="Newcomer Pathway">
                                {newcomerStages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </optgroup>
                            <optgroup label="New Believer Pathway">
                                {newBelieverStages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </optgroup>
                       </SelectField>

                       <SelectField 
                          label="Task Priority"
                          value={newRule.priority}
                          onChange={(e: any) => setNewRule({...newRule, priority: e.target.value as TaskPriority})}
                       >
                            {Object.values(TaskPriority).map(p => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                       </SelectField>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="md:col-span-2">
                            <InputField 
                                label="Task Description"
                                value={newRule.taskDescription}
                                onChange={(e: any) => setNewRule({...newRule, taskDescription: e.target.value})}
                                placeholder="e.g. Call to welcome them to the group"
                            />
                        </div>
                        <div>
                             <InputField 
                                label="Days Until Due"
                                type="number"
                                value={newRule.daysDue}
                                onChange={(e: any) => setNewRule({...newRule, daysDue: parseInt(e.target.value) || 0})}
                            />
                        </div>
                   </div>

                   <div className="flex gap-3">
                       <button 
                           onClick={handleAddRule}
                           disabled={!newRule.taskDescription}
                           className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-navy disabled:opacity-50"
                       >
                           Save Rule
                       </button>
                       <button 
                           onClick={() => setIsAddingRule(false)} 
                           className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-200"
                       >
                           Cancel
                       </button>
                   </div>
               </div>
           )}

           <div className="grid grid-cols-1 gap-4">
               {automationRules.map(rule => (
                   <div key={rule.id} className="bg-white border border-gray-200 p-6 rounded-xl flex items-center justify-between group">
                       <div className="flex items-start gap-4">
                           <div className={`p-3 rounded-lg ${rule.enabled ? 'bg-yellow-50 text-yellow-600' : 'bg-gray-100 text-gray-400'}`}>
                               <IoFlashOutline size={24} />
                           </div>
                           <div>
                               <div className="flex items-center gap-2 mb-1">
                                   <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">When entering stage:</span>
                                   <span className="text-xs font-bold bg-blue-50 text-primary px-2 py-0.5 rounded">{getStageName(rule.stageId)}</span>
                               </div>
                               <h4 className={`font-bold text-gray-800 ${!rule.enabled && 'text-gray-400 line-through'}`}>
                                   Create Task: "{rule.taskDescription}"
                               </h4>
                               <p className="text-xs text-gray-500 mt-1">
                                   Due in {rule.daysDue} days • Priority: <span className="font-semibold">{rule.priority}</span>
                               </p>
                           </div>
                       </div>
                       
                       <div className="flex items-center gap-4">
                           <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer" 
                                    checked={rule.enabled} 
                                    onChange={() => toggleRule(rule.id)}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                           </label>
                           <button 
                                onClick={() => handleDeleteRule(rule.id)}
                                className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full hover:bg-red-50"
                           >
                               <IoTrashOutline size={18} />
                           </button>
                       </div>
                   </div>
               ))}
               {automationRules.length === 0 && !isAddingRule && (
                   <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                      <IoFlashOutline className="mx-auto text-gray-300 mb-3" size={32} />
                      <p className="text-gray-500">No automation rules configured.</p>
                   </div>
               )}
           </div>
      </div>
  );

  const renderTeamSettings = () => (
      <div className="space-y-6 animate-fade-in">
           <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-800">Team Management</h3>
                    <p className="text-sm text-gray-500 mt-1">Manage who has access to this dashboard.</p>
                </div>
                <button className="flex items-center gap-2 text-sm font-bold bg-primary text-white px-4 py-2 rounded-xl hover:bg-navy">
                    <IoAddOutline size={16} /> Invite Member
                </button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {teamMembers.map(member => (
                   <div key={member.id} className="bg-white border border-gray-200 p-6 rounded-xl flex flex-col items-center text-center hover:border-primary/50 transition-colors group relative">
                       <button className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                           <IoTrashOutline size={18} />
                       </button>
                       <img src={member.avatar} alt={member.name} className="w-20 h-20 rounded-full mb-4 object-cover border-4 border-gray-50" />
                       <h4 className="font-bold text-gray-800 text-lg">{member.name}</h4>
                       <p className="text-primary text-sm font-medium mb-1">{member.role}</p>
                       <p className="text-gray-500 text-xs">{member.email}</p>
                   </div>
               ))}
           </div>
      </div>
  );

  const renderNotificationSettings = () => (
      <div className="space-y-6 animate-fade-in">
           <div className="border-b border-gray-100 pb-4">
                <h3 className="text-xl font-bold text-gray-800">Notification Preferences</h3>
                <p className="text-sm text-gray-500 mt-1">Manage how and when you receive alerts.</p>
           </div>

           <div className="space-y-4 max-w-2xl">
               <div className="bg-white border border-gray-200 p-6 rounded-xl flex items-center justify-between">
                   <div className="flex items-center gap-4">
                       <div className="p-3 bg-blue-50 text-primary rounded-lg">
                           <IoMailOutline size={24} />
                       </div>
                       <div>
                           <h4 className="font-bold text-gray-800">Email Notifications</h4>
                           <p className="text-xs text-gray-500">Receive daily digests and urgent task alerts via email.</p>
                       </div>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                   </label>
               </div>

               <div className="bg-white border border-gray-200 p-6 rounded-xl flex items-center justify-between">
                   <div className="flex items-center gap-4">
                       <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                           <IoCallOutline size={24} />
                       </div>
                       <div>
                           <h4 className="font-bold text-gray-800">SMS Alerts</h4>
                           <p className="text-xs text-gray-500">Receive texts for immediate follow-ups (e.g. new sign-ups).</p>
                       </div>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                   </label>
               </div>

               <div className="bg-white border border-gray-200 p-6 rounded-xl flex items-center justify-between">
                   <div className="flex items-center gap-4">
                       <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg">
                           <IoTimeOutline size={24} />
                       </div>
                       <div>
                           <h4 className="font-bold text-gray-800">Overdue Task Reminders</h4>
                           <p className="text-xs text-gray-500">Get nagged when tasks are 24 hours overdue.</p>
                       </div>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                   </label>
               </div>
           </div>
      </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto h-[calc(100vh-100px)]">
        
        {/* Left Navigation */}
        <div className="w-full lg:w-64 shrink-0 space-y-2">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 px-2">Settings</h2>
            
            <button 
                onClick={() => setActiveSection('GENERAL')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeSection === 'GENERAL' ? 'bg-white text-primary shadow-sm ring-1 ring-gray-100' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
            >
                <IoBusinessOutline size={18} /> General
            </button>
            <button 
                onClick={() => setActiveSection('PATHWAYS')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeSection === 'PATHWAYS' ? 'bg-white text-primary shadow-sm ring-1 ring-gray-100' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
            >
                <IoGitNetworkOutline size={18} /> Pathways
            </button>
             <button 
                onClick={() => setActiveSection('INTEGRATIONS')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeSection === 'INTEGRATIONS' ? 'bg-white text-primary shadow-sm ring-1 ring-gray-100' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
            >
                <IoCloudDownloadOutline size={18} /> Integrations
            </button>
            <button 
                onClick={() => setActiveSection('AUTOMATION')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeSection === 'AUTOMATION' ? 'bg-white text-primary shadow-sm ring-1 ring-gray-100' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
            >
                <IoFlashOutline size={18} /> Automation
            </button>
            <button 
                onClick={() => setActiveSection('TEAM')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeSection === 'TEAM' ? 'bg-white text-primary shadow-sm ring-1 ring-gray-100' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
            >
                <IoPeopleOutline size={18} /> Team Members
            </button>
            <button 
                onClick={() => setActiveSection('NOTIFICATIONS')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeSection === 'NOTIFICATIONS' ? 'bg-white text-primary shadow-sm ring-1 ring-gray-100' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
            >
                <IoNotificationsOutline size={18} /> Notifications
            </button>
        </div>

        {/* Right Content */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-8 overflow-y-auto">
            {activeSection === 'GENERAL' && renderGeneralSettings()}
            {activeSection === 'PATHWAYS' && renderPathwaySettings()}
            {activeSection === 'INTEGRATIONS' && renderIntegrationsSettings()}
            {activeSection === 'AUTOMATION' && renderAutomationSettings()}
            {activeSection === 'TEAM' && renderTeamSettings()}
            {activeSection === 'NOTIFICATIONS' && renderNotificationSettings()}
        </div>

    </div>
  );
};

export default SettingsPage;
