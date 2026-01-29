
import React, { useState } from 'react';
import { IoCheckmark, IoArrowForward, IoArrowBack, IoBusinessOutline, IoLocationOutline, IoTimeOutline, IoAdd, IoGitNetworkOutline, IoTrashOutline, IoChevronUpOutline, IoChevronDownOutline } from 'react-icons/io5';
import { useAppContext } from '../context/AppContext';
import { ChurchSettings, ServiceTime, Stage, PathwayType } from '../types';
import { NEWCOMER_STAGES, NEW_BELIEVER_STAGES } from '../constants';

const OnboardingPage: React.FC = () => {
  const { churchSettings, setChurchSettings, completeOnboarding, setNewcomerStages, setNewBelieverStages, currentUser } = useAppContext();
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  // Local Settings State
  const [localSettings, setLocalSettings] = useState<Partial<ChurchSettings>>({
      name: '',
      denomination: '',
      weeklyAttendance: '',
      address: '',
      city: '',
      country: '',
      serviceTimes: []
  });

  const [tempService, setTempService] = useState<Partial<ServiceTime>>({
      day: 'Sunday', time: '10:00', name: 'Main Service'
  });

  // Local Pathway State (initialized with defaults)
  const [localNewcomerStages, setLocalNewcomerStages] = useState<Stage[]>(NEWCOMER_STAGES);
  const [localNewBelieverStages, setLocalNewBelieverStages] = useState<Stage[]>(NEW_BELIEVER_STAGES);
  const [activePathwayTab, setActivePathwayTab] = useState<PathwayType>(PathwayType.NEWCOMER);
  const [newStageName, setNewStageName] = useState('');

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
    else handleSubmit();
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
      // 1. Prepare Church Settings
      const finalSettings: Partial<ChurchSettings> = {
          name: localSettings.name,
          denomination: localSettings.denomination,
          weeklyAttendance: localSettings.weeklyAttendance,
          address: localSettings.address,
          city: localSettings.city,
          country: localSettings.country,
          serviceTimes: localSettings.serviceTimes
      };

      // 2. Save Custom Pathways (frontend only for now)
      setNewcomerStages(localNewcomerStages);
      setNewBelieverStages(localNewBelieverStages);

      // 3. Complete onboarding and save settings to backend
      try {
          await completeOnboarding(finalSettings);
      } catch (err) {
          // Error is already set in context by completeOnboarding
          console.error('Onboarding completion failed:', err);
      }
  };

  // --- Service Handlers ---
  const addService = () => {
      if(!tempService.time || !tempService.name) return;
      const newService: ServiceTime = {
          id: `st-${Date.now()}`,
          day: tempService.day || 'Sunday',
          time: tempService.time || '09:00',
          name: tempService.name || 'Service'
      };
      setLocalSettings(prev => ({
          ...prev,
          serviceTimes: [...(prev.serviceTimes || []), newService]
      }));
  };

  // --- Pathway Handlers ---
  const getCurrentStages = () => activePathwayTab === PathwayType.NEWCOMER ? localNewcomerStages : localNewBelieverStages;
  const setCurrentStages = (stages: Stage[]) => activePathwayTab === PathwayType.NEWCOMER ? setLocalNewcomerStages(stages) : setLocalNewBelieverStages(stages);

  const addStage = () => {
      if (!newStageName.trim()) return;
      const current = getCurrentStages();
      const newStage: Stage = {
          id: `${activePathwayTab === PathwayType.NEWCOMER ? 'nc' : 'nb'}-${Date.now()}`,
          name: newStageName,
          order: current.length + 1,
          description: ''
      };
      setCurrentStages([...current, newStage]);
      setNewStageName('');
  };

  const removeStage = (id: string) => {
      const current = getCurrentStages();
      const updated = current.filter(s => s.id !== id).map((s, idx) => ({ ...s, order: idx + 1 }));
      setCurrentStages(updated);
  };

  const moveStage = (index: number, direction: 'UP' | 'DOWN') => {
      const current = [...getCurrentStages()];
      if (direction === 'UP' && index > 0) {
          [current[index], current[index - 1]] = [current[index - 1], current[index]];
      } else if (direction === 'DOWN' && index < current.length - 1) {
          [current[index], current[index + 1]] = [current[index + 1], current[index]];
      }
      // Re-index order
      const reordered = current.map((s, idx) => ({ ...s, order: idx + 1 }));
      setCurrentStages(reordered);
  };

  const renderProgressBar = () => (
      <div className="flex items-center justify-between mb-8 px-4">
          {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex flex-col items-center relative z-10">
                  <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300
                      ${step >= s ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-gray-100 text-gray-400'}
                  `}>
                      {step > s ? <IoCheckmark size={20} /> : s}
                  </div>
                  <span className={`text-[10px] font-bold mt-2 uppercase tracking-wider ${step >= s ? 'text-primary' : 'text-gray-300'}`}>
                      {s === 1 ? 'Identity' : s === 2 ? 'Location' : s === 3 ? 'Services' : 'Pathways'}
                  </span>
              </div>
          ))}
          {/* Progress Line Background */}
          <div className="absolute top-9 left-0 w-full h-1 bg-gray-100 -z-0 rounded-full" />
          {/* Active Progress Line */}
          <div 
            className="absolute top-9 left-0 h-1 bg-primary -z-0 rounded-full transition-all duration-300" 
            style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }} 
          />
      </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 flex flex-col h-[80vh] md:h-auto">
            
            {/* Header */}
            <div className="bg-navy p-6 md:p-8 text-white text-center shrink-0">
                <h1 className="text-2xl font-bold">Welcome to Pathway Tracker!</h1>
                <p className="text-secondary/80">Let's get your church set up in a few simple steps.</p>
            </div>

            <div className="p-6 md:p-10 relative flex flex-col flex-1 overflow-hidden">
                {renderProgressBar()}

                <div className="flex-1 overflow-y-auto min-h-[300px] px-1">
                    {step === 1 && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="text-center mb-6">
                                <div className="w-20 h-20 bg-blue-50 text-primary rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-lg overflow-hidden">
                                     {currentUser?.avatar ? (
                                         <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                                     ) : (
                                        <IoBusinessOutline size={32} />
                                     )}
                                </div>
                                <h2 className="text-xl font-bold text-gray-800">Church Identity</h2>
                                <p className="text-sm text-gray-500">Welcome, {currentUser?.firstName || 'Admin'}! Tell us about your organization.</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Church Name</label>
                                    <input 
                                        type="text" 
                                        value={localSettings.name}
                                        onChange={e => setLocalSettings({...localSettings, name: e.target.value})}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
                                        placeholder="e.g. Grace Community Church"
                                        autoFocus
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Denomination</label>
                                        <input 
                                            type="text" 
                                            value={localSettings.denomination}
                                            onChange={e => setLocalSettings({...localSettings, denomination: e.target.value})}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
                                            placeholder="e.g. Non-Denom"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Est. Attendance</label>
                                        <select 
                                            value={localSettings.weeklyAttendance}
                                            onChange={e => setLocalSettings({...localSettings, weeklyAttendance: e.target.value})}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
                                        >
                                            <option value="">Select...</option>
                                            <option value="0-100">0 - 100</option>
                                            <option value="100-500">100 - 500</option>
                                            <option value="500-1000">500 - 1000</option>
                                            <option value="1000+">1000+</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                         <div className="space-y-6 animate-fade-in">
                            <div className="text-center mb-6">
                                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <IoLocationOutline size={24} />
                                </div>
                                <h2 className="text-xl font-bold text-gray-800">Location Details</h2>
                                <p className="text-sm text-gray-500">Where are you located?</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Street Address</label>
                                    <input 
                                        type="text" 
                                        value={localSettings.address}
                                        onChange={e => setLocalSettings({...localSettings, address: e.target.value})}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
                                        placeholder="e.g. 123 Main St"
                                        autoFocus
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">City</label>
                                        <input 
                                            type="text" 
                                            value={localSettings.city}
                                            onChange={e => setLocalSettings({...localSettings, city: e.target.value})}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
                                            placeholder="City"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Country</label>
                                        <input 
                                            type="text" 
                                            value={localSettings.country}
                                            onChange={e => setLocalSettings({...localSettings, country: e.target.value})}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
                                            placeholder="Country"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="text-center mb-6">
                                <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <IoTimeOutline size={24} />
                                </div>
                                <h2 className="text-xl font-bold text-gray-800">Service Times</h2>
                                <p className="text-sm text-gray-500">When do you meet?</p>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                <div className="flex flex-col md:flex-row gap-2 mb-2">
                                     <select 
                                        value={tempService.day}
                                        onChange={e => setTempService({...tempService, day: e.target.value})}
                                        className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-primary outline-none"
                                     >
                                         {['Sunday', 'Saturday', 'Wednesday'].map(d => <option key={d} value={d}>{d}</option>)}
                                     </select>
                                     <input 
                                        type="time" 
                                        value={tempService.time}
                                        onChange={e => setTempService({...tempService, time: e.target.value})}
                                        className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-primary outline-none"
                                     />
                                     <input 
                                        type="text" 
                                        value={tempService.name}
                                        onChange={e => setTempService({...tempService, name: e.target.value})}
                                        placeholder="Service Name"
                                        className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-primary outline-none"
                                     />
                                     <button 
                                        onClick={addService}
                                        className="bg-primary text-white p-2 rounded-lg hover:bg-navy transition-colors"
                                     >
                                         <IoAdd size={20} />
                                     </button>
                                </div>
                                
                                <div className="space-y-2 mt-4">
                                    {localSettings.serviceTimes?.map((st, i) => (
                                        <div key={i} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                            <div>
                                                <p className="font-bold text-sm text-gray-800">{st.name}</p>
                                                <p className="text-xs text-gray-500">{st.day} @ {st.time}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {(!localSettings.serviceTimes || localSettings.serviceTimes.length === 0) && (
                                        <p className="text-center text-xs text-gray-400 italic">No services added yet.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-6 animate-fade-in flex flex-col h-full">
                            <div className="text-center mb-6 shrink-0">
                                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <IoGitNetworkOutline size={24} />
                                </div>
                                <h2 className="text-xl font-bold text-gray-800">Integration Pathways</h2>
                                <p className="text-sm text-gray-500">Define the steps for your people.</p>
                            </div>

                            {/* Tabs */}
                            <div className="flex bg-gray-100 p-1 rounded-xl shrink-0">
                                <button 
                                    onClick={() => setActivePathwayTab(PathwayType.NEWCOMER)}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activePathwayTab === PathwayType.NEWCOMER ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}
                                >
                                    Newcomer
                                </button>
                                <button 
                                    onClick={() => setActivePathwayTab(PathwayType.NEW_BELIEVER)}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activePathwayTab === PathwayType.NEW_BELIEVER ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}
                                >
                                    New Believer
                                </button>
                            </div>

                            {/* Stage Editor */}
                            <div className="bg-gray-50 rounded-xl border border-gray-200 flex-1 overflow-hidden flex flex-col">
                                <div className="p-2 border-b border-gray-200 bg-white flex gap-2">
                                    <input 
                                        type="text"
                                        value={newStageName}
                                        onChange={(e) => setNewStageName(e.target.value)}
                                        placeholder="Add new stage name..."
                                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                                        onKeyDown={(e) => e.key === 'Enter' && addStage()}
                                    />
                                    <button 
                                        onClick={addStage}
                                        className="px-4 bg-primary text-white rounded-lg hover:bg-navy transition-colors"
                                    >
                                        <IoAdd size={20} />
                                    </button>
                                </div>

                                <div className="overflow-y-auto p-2 space-y-2 flex-1">
                                    {getCurrentStages().map((stage, index) => (
                                        <div key={stage.id} className="bg-white p-3 rounded-lg border border-gray-200 flex items-center justify-between group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">
                                                    {index + 1}
                                                </div>
                                                <span className="text-sm font-semibold text-gray-800">{stage.name}</span>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => moveStage(index, 'UP')} className="p-1 text-gray-400 hover:text-primary"><IoChevronUpOutline /></button>
                                                <button onClick={() => moveStage(index, 'DOWN')} className="p-1 text-gray-400 hover:text-primary"><IoChevronDownOutline /></button>
                                                <button onClick={() => removeStage(stage.id)} className="p-1 text-gray-400 hover:text-red-500 ml-1"><IoTrashOutline /></button>
                                            </div>
                                        </div>
                                    ))}
                                    {getCurrentStages().length === 0 && (
                                        <p className="text-center text-xs text-gray-400 py-4 italic">No stages defined.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-between pt-6 mt-6 border-t border-gray-100 shrink-0">
                    <button 
                        onClick={handleBack}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-colors ${step === 1 ? 'invisible' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <IoArrowBack /> Back
                    </button>
                    
                    <button 
                        onClick={handleNext}
                        disabled={step === 1 && !localSettings.name}
                        className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:bg-navy transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {step === totalSteps ? 'Finish Setup' : 'Next Step'} <IoArrowForward />
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default OnboardingPage;
