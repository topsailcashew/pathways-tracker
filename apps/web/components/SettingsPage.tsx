
import React, { useState, useRef } from 'react';
import {
    IoAddOutline, IoTrashOutline, IoPencilOutline, IoSaveOutline,  IoReorderTwoOutline,
    IoBusinessOutline, IoGitNetworkOutline, IoPeopleOutline, IoNotificationsOutline,
    IoTimeOutline, IoFlashOutline
} from 'react-icons/io5';
import { Stage, PathwayType, ChurchSettings, ServiceTime, AutomationRule, TaskPriority, AutoAdvanceRule } from '../types';
import { useAppContext } from '../context/AppContext';

// Reusable Components
const InputField = ({ label, value, onChange, placeholder, type = 'text', className = '' }: any) => (
    <div className={`space-y-1 ${className}`}>
        <label className="text-xs font-bold text-gray-500 uppercase">{label}</label>
        <input type={type} value={value} onChange={onChange} placeholder={placeholder} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
    </div>
);

const SelectField = ({ label, value, onChange, options, children }: any) => (
    <div className="space-y-1">
        <label className="text-xs font-bold text-gray-500 uppercase">{label}</label>
        <select value={value} onChange={onChange} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary">
            {children || options?.map((opt: any) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
);

const SettingsPage: React.FC = () => {
  const {
    churchSettings, setChurchSettings, saveChurchSettings,
    newcomerStages, setNewcomerStages,
    newBelieverStages, setNewBelieverStages,
    automationRules, setAutomationRules,
    apiCreateStage, apiUpdateStage, apiDeleteStage, apiReorderStages,
  } = useAppContext();

  const [activeSection, setActiveSection] = useState<'GENERAL' | 'PATHWAYS' | 'TEAM' | 'NOTIFICATIONS' | 'AUTOMATION'>('GENERAL');
  
  // Pathways State
  const [activePathwayTab, setActivePathwayTab] = useState<PathwayType>(PathwayType.NEWCOMER);
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  
  // Edit Form State
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editAutoRuleType, setEditAutoRuleType] = useState<'NONE' | 'TASK_COMPLETED' | 'TIME_IN_STAGE'>('NONE');
  const [editAutoRuleValue, setEditAutoRuleValue] = useState<string | number>('');

  const [newStageName, setNewStageName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const dragItem = useRef<number | null>(null);

  // Service Time State
  const [newService, setNewService] = useState<Partial<ServiceTime>>({ day: 'Sunday', time: '09:00', name: '' });

  // Automation State
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [newRule, setNewRule] = useState<Partial<AutomationRule>>({
      stageId: newcomerStages[0]?.id || '', taskDescription: '', daysDue: 2, priority: TaskPriority.MEDIUM, enabled: true
  });

  const teamMembers: { id: number; name: string; role: string; email: string; avatar: string }[] = [];

  // General Settings Save State
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // General Settings Handlers
  const handleSettingChange = (field: keyof ChurchSettings, value: any) => {
    setChurchSettings({ ...churchSettings, [field]: value });
    setIsDirty(true);
    setSaveSuccess(false);
    setSaveError(null);
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await saveChurchSettings(churchSettings);
      setIsDirty(false);
      setSaveSuccess(true);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddService = () => {
    if (!newService.time || !newService.name) return;
    const service: ServiceTime = { id: `st-${Date.now()}`, day: newService.day || 'Sunday', time: newService.time, name: newService.name };
    handleSettingChange('serviceTimes', [...churchSettings.serviceTimes, service]);
    setNewService({ day: 'Sunday', time: '', name: '' });
  };

  const handleDeleteService = (id: string) => handleSettingChange('serviceTimes', churchSettings.serviceTimes.filter(st => st.id !== id));

  // Pathways Logic
  const currentStages = activePathwayTab === PathwayType.NEWCOMER ? newcomerStages : newBelieverStages;
  const setStages = activePathwayTab === PathwayType.NEWCOMER ? setNewcomerStages : setNewBelieverStages;

  const handleUpdateOrder = (stagesToUpdate: Stage[], persistToApi = false) => {
    const reordered = stagesToUpdate.map((s, idx) => ({ ...s, order: idx + 1 }));
    setStages(reordered);
    if (persistToApi) {
      const pathway = activePathwayTab === PathwayType.NEWCOMER ? 'NEWCOMER' as const : 'NEW_BELIEVER' as const;
      const reorders = reordered.map(s => ({ stageId: s.id, newOrder: s.order }));
      apiReorderStages(pathway, reorders).catch(err => console.error('Failed to reorder stages:', err));
    }
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

  const handleDragEnd = () => {
    dragItem.current = null;
    setDraggingIndex(null);
    // Persist new order to API
    const pathway = activePathwayTab === PathwayType.NEWCOMER ? 'NEWCOMER' as const : 'NEW_BELIEVER' as const;
    const reorders = currentStages.map((s, idx) => ({ stageId: s.id, newOrder: idx + 1 }));
    apiReorderStages(pathway, reorders).catch(err => console.error('Failed to reorder stages:', err));
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  const [isSavingStage, setIsSavingStage] = useState(false);

  const handleAddStage = async () => {
    if (!newStageName.trim()) return;
    setIsSavingStage(true);
    try {
      const pathway = activePathwayTab === PathwayType.NEWCOMER ? 'NEWCOMER' as const : 'NEW_BELIEVER' as const;
      await apiCreateStage({
        pathway,
        name: newStageName.trim(),
        order: currentStages.length + 1,
      });
      setNewStageName('');
      setIsAdding(false);
    } catch (err: any) {
      alert(err.message || 'Failed to add stage');
    } finally {
      setIsSavingStage(false);
    }
  };

  const handleDeleteStage = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this stage?')) {
      try {
        await apiDeleteStage(id);
      } catch (err: any) {
        alert(err.message || 'Failed to delete stage');
      }
    }
  };

  const startEditing = (stage: Stage) => { 
      setEditingStageId(stage.id); 
      setEditName(stage.name); 
      setEditDescription(stage.description || '');
      
      // Load rule
      if (stage.autoAdvanceRule) {
          setEditAutoRuleType(stage.autoAdvanceRule.type);
          setEditAutoRuleValue(stage.autoAdvanceRule.value);
      } else {
          setEditAutoRuleType('NONE');
          setEditAutoRuleValue('');
      }
  };

  const saveEdit = async () => {
    if (!editName.trim() || !editingStageId) return;

    try {
      const updateData: any = {
        name: editName.trim(),
        description: editDescription || undefined,
      };

      if (editAutoRuleType !== 'NONE' && editAutoRuleValue) {
        updateData.autoAdvanceEnabled = true;
        updateData.autoAdvanceType = editAutoRuleType;
        updateData.autoAdvanceValue = String(editAutoRuleValue);
      } else {
        updateData.autoAdvanceEnabled = false;
        updateData.autoAdvanceType = undefined;
        updateData.autoAdvanceValue = undefined;
      }

      await apiUpdateStage(editingStageId, updateData);
    } catch (err: any) {
      // Also update locally as fallback
      let autoAdvanceRule: AutoAdvanceRule | undefined = undefined;
      if (editAutoRuleType !== 'NONE' && editAutoRuleValue) {
        autoAdvanceRule = {
          type: editAutoRuleType,
          value: editAutoRuleType === 'TIME_IN_STAGE' ? Number(editAutoRuleValue) : String(editAutoRuleValue)
        };
      }
      setStages(currentStages.map((s) => s.id === editingStageId ? {
        ...s,
        name: editName,
        description: editDescription,
        autoAdvanceRule
      } : s));
    }

    setEditingStageId(null);
  };

  // Automation Handlers
  const toggleRule = (id: string) => setAutomationRules(automationRules.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r));
  const handleAddRule = () => {
    if (!newRule.taskDescription || !newRule.stageId) return;
    const rule: AutomationRule = { id: `ar-${Date.now()}`, stageId: newRule.stageId, taskDescription: newRule.taskDescription, daysDue: newRule.daysDue || 2, priority: newRule.priority || TaskPriority.MEDIUM, enabled: true };
    setAutomationRules([...automationRules, rule]);
    setIsAddingRule(false);
    setNewRule({ stageId: newcomerStages[0]?.id || '', taskDescription: '', daysDue: 2, priority: TaskPriority.MEDIUM, enabled: true });
  };
  const handleDeleteRule = (id: string) => { if(window.confirm('Delete this rule?')) setAutomationRules(automationRules.filter(r => r.id !== id)); };


  const renderGeneralSettings = () => (
      <div className="space-y-8 animate-fade-in pb-10">
          <div>
              <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2 mb-4">Church Identity</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField label="Church Name" value={churchSettings.name} onChange={(e: any) => handleSettingChange('name', e.target.value)} />
                  <InputField label="Denomination" value={churchSettings.denomination} onChange={(e: any) => handleSettingChange('denomination', e.target.value)} />
              </div>
          </div>
          <div>
              <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2 mb-4">Service Times</h3>
              <div className="space-y-4">
                {churchSettings.serviceTimes.map((service) => (
                  <div key={service.id} className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                     <div className="p-2 bg-white rounded border border-gray-200 text-gray-500"><IoTimeOutline /></div>
                     <div className="flex-1"><p className="text-sm font-bold text-gray-800">{service.name}</p><p className="text-xs text-gray-500">{service.day} at {service.time}</p></div>
                     <button onClick={() => handleDeleteService(service.id)} className="text-gray-400 hover:text-red-500 p-2"><IoTrashOutline /></button>
                  </div>
                ))}
                <div className="flex flex-col md:flex-row items-start md:items-center gap-2 p-3 bg-blue-50/50 rounded-lg border border-blue-100 border-dashed">
                     <select value={newService.day} onChange={e => setNewService({...newService, day: e.target.value})} className="w-full md:w-auto bg-white border border-gray-200 text-xs rounded px-2 py-2 focus:outline-none focus:border-primary">
                         {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d) => <option key={d} value={d}>{d}</option>)}
                     </select>
                     <input type="time" value={newService.time} onChange={e => setNewService({...newService, time: e.target.value})} className="w-full md:w-auto bg-white border border-gray-200 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-primary" />
                     <input type="text" placeholder="Service Name" value={newService.name} onChange={e => setNewService({...newService, name: e.target.value})} className="w-full md:flex-1 bg-white border border-gray-200 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-primary" />
                     <button onClick={handleAddService} className="w-full md:w-auto p-1.5 bg-primary text-white rounded hover:bg-navy disabled:opacity-50 flex justify-center" disabled={!newService.time || !newService.name}><IoAddOutline size={16} /></button>
                </div>
              </div>
          </div>
          {/* Save Button & Feedback */}
          <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
              <button
                  onClick={handleSaveSettings}
                  disabled={isSaving || !isDirty}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-navy transition-colors text-sm font-medium disabled:opacity-50"
              >
                  <IoSaveOutline size={16} />
                  {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              {saveSuccess && <span className="text-sm text-green-600 font-medium">Settings saved successfully</span>}
              {saveError && <span className="text-sm text-red-600 font-medium">{saveError}</span>}
          </div>
      </div>
  );


  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto h-[calc(100vh-100px)]">
        <div className="w-full lg:w-64 shrink-0 space-y-2">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 px-2">Settings</h2>
            {[
                { id: 'GENERAL', label: 'General', icon: IoBusinessOutline },
                { id: 'PATHWAYS', label: 'Pathways', icon: IoGitNetworkOutline },
                { id: 'AUTOMATION', label: 'Automation', icon: IoFlashOutline },
                { id: 'TEAM', label: 'Team', icon: IoPeopleOutline },
                { id: 'NOTIFICATIONS', label: 'Notifications', icon: IoNotificationsOutline }
            ].map((item) => (
                <button key={item.id} onClick={() => setActiveSection(item.id as any)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeSection === item.id ? 'bg-white text-primary shadow-sm ring-1 ring-gray-100' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}>
                    <item.icon size={18} /> {item.label}
                </button>
            ))}
        </div>

        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-8 overflow-y-auto">
            {activeSection === 'GENERAL' && renderGeneralSettings()}
            {activeSection === 'PATHWAYS' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-4"><div><h3 className="text-xl font-bold text-gray-800">Pathway Configuration</h3></div></div>
                    <div className="flex p-1 bg-gray-100 rounded-xl w-fit"><button onClick={() => setActivePathwayTab(PathwayType.NEWCOMER)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activePathwayTab === PathwayType.NEWCOMER ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Newcomer</button><button onClick={() => setActivePathwayTab(PathwayType.NEW_BELIEVER)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activePathwayTab === PathwayType.NEW_BELIEVER ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>New Believer</button></div>
                    <div className="space-y-3 max-w-2xl">
                        {currentStages.map((stage, index) => (
                            <div key={stage.id} draggable onDragStart={(e) => handleDragStart(e, index)} onDragEnter={(e) => handleDragEnter(e, index)} onDragEnd={handleDragEnd} onDragOver={handleDragOver} className={`bg-white border border-gray-200 p-4 rounded-xl flex items-center gap-4 group ${draggingIndex === index ? 'opacity-50 border-dashed border-primary' : ''}`}>
                                <button className="text-gray-400 cursor-grab active:cursor-grabbing hover:text-gray-600"><IoReorderTwoOutline size={20} /></button>
                                <div className="w-8 h-8 bg-blue-50 text-primary rounded-full flex items-center justify-center font-bold text-sm shrink-0">{index + 1}</div>
                                <div className="flex-1 min-w-0">
                                    {editingStageId === stage.id ? (
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-center gap-2">
                                                <input autoFocus type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm w-full" placeholder="Stage Name" />
                                                <button onClick={saveEdit} className="p-1.5 bg-green-100 text-green-700 rounded"><IoSaveOutline /></button>
                                            </div>
                                            <input type="text" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs w-full" placeholder="Description" />
                                            
                                            {/* Auto Advance Rules Config */}
                                            <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                                                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Auto-Advance Condition</label>
                                                <div className="flex gap-2">
                                                    <select 
                                                        value={editAutoRuleType} 
                                                        onChange={(e) => setEditAutoRuleType(e.target.value as any)}
                                                        className="px-2 py-1 border border-gray-300 rounded text-xs bg-white"
                                                    >
                                                        <option value="NONE">None (Manual)</option>
                                                        <option value="TASK_COMPLETED">Task Completed</option>
                                                        <option value="TIME_IN_STAGE">Time in Stage</option>
                                                    </select>
                                                    
                                                    {editAutoRuleType === 'TASK_COMPLETED' && (
                                                        <input 
                                                            type="text" 
                                                            placeholder="Task Desc contains..." 
                                                            value={editAutoRuleValue}
                                                            onChange={(e) => setEditAutoRuleValue(e.target.value)}
                                                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                                                        />
                                                    )}
                                                    
                                                    {editAutoRuleType === 'TIME_IN_STAGE' && (
                                                        <div className="flex items-center gap-1">
                                                            <input 
                                                                type="number" 
                                                                placeholder="Days" 
                                                                value={editAutoRuleValue}
                                                                onChange={(e) => setEditAutoRuleValue(e.target.value)}
                                                                className="w-16 px-2 py-1 border border-gray-300 rounded text-xs"
                                                            />
                                                            <span className="text-xs text-gray-500">days</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <h4 className="font-bold text-gray-700 truncate">{stage.name}</h4>
                                            {stage.description && <p className="text-xs text-gray-500 truncate">{stage.description}</p>}
                                            {stage.autoAdvanceRule && (
                                                <p className="text-[10px] text-blue-600 mt-1 flex items-center gap-1">
                                                    <IoFlashOutline size={10} /> Auto-advance: 
                                                    {stage.autoAdvanceRule.type === 'TASK_COMPLETED' ? ` Task "${stage.autoAdvanceRule.value}"` : ` After ${stage.autoAdvanceRule.value} days`}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => startEditing(stage)} className="p-2 text-gray-400 hover:text-blue-600 rounded"><IoPencilOutline size={16} /></button><button onClick={() => handleDeleteStage(stage.id)} className="p-2 text-gray-400 hover:text-red-600 rounded"><IoTrashOutline size={16} /></button></div>
                            </div>
                        ))}
                        {isAdding ? (
                            <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl flex items-center gap-4 animate-fade-in"><input autoFocus type="text" value={newStageName} onChange={(e) => setNewStageName(e.target.value)} placeholder="Stage Name" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" onKeyDown={(e) => e.key === 'Enter' && handleAddStage()} /><button onClick={handleAddStage} disabled={isSavingStage} className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold disabled:opacity-50">{isSavingStage ? 'Adding...' : 'Add'}</button><button onClick={() => setIsAdding(false)} className="px-3 py-2 text-gray-500 rounded-lg text-xs font-bold">Cancel</button></div>
                        ) : (
                            <button onClick={() => setIsAdding(true)} className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 font-bold text-sm hover:border-primary hover:text-primary hover:bg-blue-50/30 transition-all flex items-center justify-center gap-2"><IoAddOutline size={18} /> Add Stage</button>
                        )}
                    </div>
                </div>
            )}
            {activeSection === 'AUTOMATION' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-4"><div><h3 className="text-xl font-bold text-gray-800">Automation Rules</h3></div>{!isAddingRule && <button onClick={() => setIsAddingRule(true)} className="flex items-center gap-2 text-sm font-bold bg-primary text-white px-4 py-2 rounded-xl hover:bg-navy"><IoAddOutline size={16} /> New Rule</button>}</div>
                    {isAddingRule && <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-4 animate-fade-in"><div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4"><SelectField label="Trigger Stage" value={newRule.stageId} onChange={(e: any) => setNewRule({...newRule, stageId: e.target.value})}><optgroup label="Newcomer">{newcomerStages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</optgroup></SelectField><SelectField label="Priority" value={newRule.priority} onChange={(e: any) => setNewRule({...newRule, priority: e.target.value as TaskPriority})}>{Object.values(TaskPriority).map((p) => <option key={p} value={p}>{p}</option>)}</SelectField></div><InputField label="Task Description" value={newRule.taskDescription} onChange={(e: any) => setNewRule({...newRule, taskDescription: e.target.value})} /><div className="flex gap-3 mt-4"><button onClick={handleAddRule} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold">Save</button><button onClick={() => setIsAddingRule(false)} className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-bold">Cancel</button></div></div>}
                    <div className="grid grid-cols-1 gap-4">{automationRules.map((rule) => (
                        <div key={rule.id} className="bg-white border border-gray-200 p-6 rounded-xl flex items-center justify-between group">
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-lg ${rule.enabled ? 'bg-yellow-50 text-yellow-600' : 'bg-gray-100 text-gray-400'}`}>
                                    <IoFlashOutline size={24} />
                                </div>
                                <div>
                                    <h4 className={`font-bold text-gray-800 ${!rule.enabled && 'text-gray-400 line-through'}`}>{rule.taskDescription}</h4>
                                    <p className="text-xs text-gray-500 mt-1">Due in {rule.daysDue} days</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={rule.enabled} onChange={() => toggleRule(rule.id)} />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                                <button onClick={() => handleDeleteRule(rule.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full hover:bg-red-50">
                                    <IoTrashOutline size={18} />
                                </button>
                            </div>
                        </div>
                    ))}</div>
                </div>
            )}
            {activeSection === 'TEAM' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                        <div><h3 className="text-xl font-bold text-gray-800">Team Management</h3></div>
                    </div>
                    {teamMembers.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {teamMembers.map((member) => (
                                <div key={member.id} className="bg-white border border-gray-200 p-6 rounded-xl flex flex-col items-center text-center">
                                    <img src={member.avatar} alt={member.name} className="w-20 h-20 rounded-full mb-4 object-cover" />
                                    <h4 className="font-bold text-gray-800">{member.name}</h4>
                                    <p className="text-primary text-sm font-medium">{member.role}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-400 text-sm text-center py-8">No team members yet. Invite people to join your church workspace.</p>
                    )}
                </div>
            )}
            {activeSection === 'NOTIFICATIONS' && <div className="space-y-6 animate-fade-in"><div className="border-b border-gray-100 pb-4"><h3 className="text-xl font-bold text-gray-800">Notification Preferences</h3></div><div className="space-y-4 max-w-2xl"><div className="bg-white border border-gray-200 p-6 rounded-xl flex items-center justify-between"><div className="flex items-center gap-4"><div className="p-3 bg-blue-50 text-primary rounded-lg"><IoNotificationsOutline size={24} /></div><div><h4 className="font-bold text-gray-800">Email Notifications</h4></div></div><input type="checkbox" defaultChecked /></div></div></div>}
        </div>
    </div>
  );
};

export default SettingsPage;
