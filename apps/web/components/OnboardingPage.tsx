
import React, { useState } from 'react';
import { IoCheckmark, IoArrowForward, IoArrowBack, IoBusinessOutline, IoLocationOutline, IoTimeOutline, IoAdd, IoGitNetworkOutline, IoTrashOutline, IoChevronUpOutline, IoChevronDownOutline } from 'react-icons/io5';
import { useAppContext } from '../context/AppContext';
import { ChurchSettings, ServiceTime, Stage, PathwayType } from '../types';
import { NEWCOMER_STAGES, NEW_BELIEVER_STAGES } from '../constants';

const OnboardingPage: React.FC = () => {
  const { completeOnboarding, setNewcomerStages, setNewBelieverStages, currentUser } = useAppContext();
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  const [isCompletingOnboarding, setIsCompletingOnboarding] = useState(false);

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';

  // Simplified onboarding for invited (non-admin) users
  if (!isAdmin) {
      const handleVolunteerComplete = async () => {
          setIsCompletingOnboarding(true);
          try {
              await completeOnboarding({});
          } catch (err) {
              console.error('Onboarding completion failed:', err);
          } finally {
              setIsCompletingOnboarding(false);
          }
      };

      return (
          <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center p-6">
              <div className="bg-white rounded-2xl shadow-sm border border-[#E5E0D2] p-8 w-full max-w-lg">
                  <div className="text-center mb-8">
                      <div className="w-16 h-16 rounded-full bg-[#EFEBE0] flex items-center justify-center mx-auto mb-5 overflow-hidden">
                          {currentUser?.avatar ? (
                              <img src={currentUser.avatar} alt={currentUser.firstName} className="w-full h-full object-cover rounded-full" />
                          ) : (
                              <span className="text-2xl font-bold text-[#14213D]">{currentUser?.firstName?.charAt(0)}{currentUser?.lastName?.charAt(0)}</span>
                          )}
                      </div>
                      <h1 className="text-[2.125rem] font-bold tracking-tight text-[#14213D]">Welcome to Shepherd!</h1>
                      <p className="text-sm text-[#6B6960] mt-1">
                          Hi, {currentUser?.firstName}! You've been invited to join the team. Click below to get started.
                      </p>
                  </div>
                  <button
                      onClick={handleVolunteerComplete}
                      disabled={isCompletingOnboarding}
                      className="bg-[#14213D] text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-[#1F2D52] transition-colors w-full flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                      {isCompletingOnboarding ? 'Setting up...' : 'Get Started'} <IoArrowForward size={16} />
                  </button>
              </div>
          </div>
      );
  }

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
          [current[index], current[index - 1]] = [current[index - 1]!, current[index]!];
      } else if (direction === 'DOWN' && index < current.length - 1) {
          [current[index], current[index + 1]] = [current[index + 1]!, current[index]!];
      }
      // Re-index order
      const reordered = current.map((s, idx) => ({ ...s, order: idx + 1 }));
      setCurrentStages(reordered);
  };

  const stepLabels = ['Identity', 'Location', 'Services', 'Pathways'];

  const renderProgressBar = () => (
      <div className="mb-8">
          {/* Step indicators */}
          <div className="flex items-center justify-between relative">
              {/* Track behind indicators */}
              <div className="absolute top-4 left-0 w-full h-1.5 bg-black/[0.08] rounded-full -z-0" />
              <div
                className="absolute top-4 left-0 h-1.5 bg-[#FCA311] rounded-full -z-0 transition-all duration-300"
                style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
              />
              {[1, 2, 3, 4].map((s) => (
                  <div key={s} className="flex flex-col items-center relative z-10">
                      <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300
                          ${step > s
                              ? 'bg-[#FCA311] text-[#14213D]'
                              : step === s
                                  ? 'bg-[#14213D] text-white'
                                  : 'bg-white border-2 border-[#D8D2C2] text-[#9E9D95]'
                          }
                      `}>
                          {step > s ? <IoCheckmark size={16} /> : s}
                      </div>
                      <span className={`text-[10px] font-semibold uppercase tracking-[0.08em] mt-2 ${step >= s ? 'text-[#14213D]' : 'text-[#9E9D95]'}`}>
                          {stepLabels[s - 1]}
                      </span>
                  </div>
              ))}
          </div>
      </div>
  );

  const inputCls = "bg-white border border-[#D8D2C2] rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[rgba(46,102,229,0.20)] focus:border-[#FCA311]";
  const labelCls = "text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960] block mb-1.5";

  return (
    <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-[#E5E0D2] p-8 w-full max-w-lg flex flex-col" style={{ maxHeight: '90vh' }}>

            {/* Header */}
            <div className="mb-6 shrink-0">
                <h1 className="text-[2.125rem] font-bold tracking-tight text-[#14213D]">Welcome to Shepherd!</h1>
                <p className="text-sm text-[#6B6960] mt-1">Let's get your church set up in a few simple steps.</p>
            </div>

            <div className="shrink-0">
                {renderProgressBar()}
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 pr-1">
                {step === 1 && (
                    <div className="space-y-5 animate-fade-in">
                        <div className="text-center mb-5">
                            <div className="w-16 h-16 bg-[#EFEBE0] rounded-full flex items-center justify-center mx-auto mb-4">
                                {currentUser?.avatar ? (
                                    <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover rounded-full" />
                                ) : (
                                    <IoBusinessOutline size={28} className="text-[#14213D]" />
                                )}
                            </div>
                            <h2 className="text-lg font-bold text-[#14213D]">Church Identity</h2>
                            <p className="text-sm text-[#6B6960]">Welcome, {currentUser?.firstName || 'Admin'}! Tell us about your organization.</p>
                        </div>

                        <div>
                            <label className={labelCls}>Church Name</label>
                            <input
                                type="text"
                                value={localSettings.name}
                                onChange={e => setLocalSettings({...localSettings, name: e.target.value})}
                                className={inputCls}
                                placeholder="e.g. Grace Community Church"
                                autoFocus
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Denomination</label>
                                <input
                                    type="text"
                                    value={localSettings.denomination}
                                    onChange={e => setLocalSettings({...localSettings, denomination: e.target.value})}
                                    className={inputCls}
                                    placeholder="e.g. Non-Denom"
                                />
                            </div>
                            <div>
                                <label className={labelCls}>Est. Attendance</label>
                                <select
                                    value={localSettings.weeklyAttendance}
                                    onChange={e => setLocalSettings({...localSettings, weeklyAttendance: e.target.value})}
                                    className={inputCls}
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
                )}

                {step === 2 && (
                    <div className="space-y-5 animate-fade-in">
                        <div className="text-center mb-5">
                            <div className="w-12 h-12 bg-[#EFEBE0] rounded-full flex items-center justify-center mx-auto mb-3">
                                <IoLocationOutline size={22} className="text-[#14213D]" />
                            </div>
                            <h2 className="text-lg font-bold text-[#14213D]">Location Details</h2>
                            <p className="text-sm text-[#6B6960]">Where are you located?</p>
                        </div>

                        <div>
                            <label className={labelCls}>Street Address</label>
                            <input
                                type="text"
                                value={localSettings.address}
                                onChange={e => setLocalSettings({...localSettings, address: e.target.value})}
                                className={inputCls}
                                placeholder="e.g. 123 Main St"
                                autoFocus
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>City</label>
                                <input
                                    type="text"
                                    value={localSettings.city}
                                    onChange={e => setLocalSettings({...localSettings, city: e.target.value})}
                                    className={inputCls}
                                    placeholder="City"
                                />
                            </div>
                            <div>
                                <label className={labelCls}>Country</label>
                                <input
                                    type="text"
                                    value={localSettings.country}
                                    onChange={e => setLocalSettings({...localSettings, country: e.target.value})}
                                    className={inputCls}
                                    placeholder="Country"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-5 animate-fade-in">
                        <div className="text-center mb-5">
                            <div className="w-12 h-12 bg-[#EFEBE0] rounded-full flex items-center justify-center mx-auto mb-3">
                                <IoTimeOutline size={22} className="text-[#14213D]" />
                            </div>
                            <h2 className="text-lg font-bold text-[#14213D]">Service Times</h2>
                            <p className="text-sm text-[#6B6960]">When do you meet?</p>
                        </div>

                        <div className="bg-[#FAF8F4] p-4 rounded-xl border border-[#E5E0D2]">
                            <div className="flex flex-col md:flex-row gap-2 mb-3">
                                <select
                                    value={tempService.day}
                                    onChange={e => setTempService({...tempService, day: e.target.value})}
                                    className="bg-white border border-[#D8D2C2] rounded-lg px-3 py-2 text-sm focus:border-[#FCA311] outline-none"
                                >
                                    {['Sunday', 'Saturday', 'Wednesday'].map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                                <input
                                    type="time"
                                    value={tempService.time}
                                    onChange={e => setTempService({...tempService, time: e.target.value})}
                                    className="bg-white border border-[#D8D2C2] rounded-lg px-3 py-2 text-sm focus:border-[#FCA311] outline-none"
                                />
                                <input
                                    type="text"
                                    value={tempService.name}
                                    onChange={e => setTempService({...tempService, name: e.target.value})}
                                    placeholder="Service Name"
                                    className="flex-1 bg-white border border-[#D8D2C2] rounded-lg px-3 py-2 text-sm focus:border-[#FCA311] outline-none"
                                />
                                <button
                                    onClick={addService}
                                    className="bg-[#14213D] text-white p-2 rounded-lg hover:bg-[#1F2D52] transition-colors"
                                >
                                    <IoAdd size={20} />
                                </button>
                            </div>

                            <div className="space-y-2">
                                {localSettings.serviceTimes?.map((st, i) => (
                                    <div key={i} className="flex justify-between items-center bg-white p-3 rounded-lg border border-[#E5E0D2]">
                                        <div>
                                            <p className="font-semibold text-sm text-[#14213D]">{st.name}</p>
                                            <p className="text-xs text-[#6B6960]">{st.day} @ {st.time}</p>
                                        </div>
                                    </div>
                                ))}
                                {(!localSettings.serviceTimes || localSettings.serviceTimes.length === 0) && (
                                    <p className="text-center text-xs text-[#9E9D95] italic py-2">No services added yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-5 animate-fade-in flex flex-col">
                        <div className="text-center mb-4 shrink-0">
                            <div className="w-12 h-12 bg-[#EFEBE0] rounded-full flex items-center justify-center mx-auto mb-3">
                                <IoGitNetworkOutline size={22} className="text-[#14213D]" />
                            </div>
                            <h2 className="text-lg font-bold text-[#14213D]">Integration Pathways</h2>
                            <p className="text-sm text-[#6B6960]">Define the steps for your people.</p>
                        </div>

                        {/* Tabs */}
                        <div className="bg-[#FAF8F4] rounded-full p-1 inline-flex shrink-0">
                            <button
                                onClick={() => setActivePathwayTab(PathwayType.NEWCOMER)}
                                className={`px-5 py-1.5 text-sm rounded-full transition-colors ${activePathwayTab === PathwayType.NEWCOMER ? 'bg-white border border-[#D8D2C2] text-[#14213D] font-medium' : 'text-[#6B6960] hover:text-[#14213D]'}`}
                            >
                                Newcomer
                            </button>
                            <button
                                onClick={() => setActivePathwayTab(PathwayType.NEW_BELIEVER)}
                                className={`px-5 py-1.5 text-sm rounded-full transition-colors ${activePathwayTab === PathwayType.NEW_BELIEVER ? 'bg-white border border-[#D8D2C2] text-[#14213D] font-medium' : 'text-[#6B6960] hover:text-[#14213D]'}`}
                            >
                                New Believer
                            </button>
                        </div>

                        {/* Stage Editor */}
                        <div className="bg-[#FAF8F4] rounded-xl border border-[#E5E0D2] overflow-hidden">
                            <div className="p-2 border-b border-[#E5E0D2] bg-white flex gap-2">
                                <input
                                    type="text"
                                    value={newStageName}
                                    onChange={(e) => setNewStageName(e.target.value)}
                                    placeholder="Add new stage name..."
                                    className="flex-1 bg-white border border-[#D8D2C2] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#FCA311]"
                                    onKeyDown={(e) => e.key === 'Enter' && addStage()}
                                />
                                <button
                                    onClick={addStage}
                                    className="px-4 bg-[#14213D] text-white rounded-lg hover:bg-[#1F2D52] transition-colors"
                                >
                                    <IoAdd size={20} />
                                </button>
                            </div>

                            <div className="p-2 space-y-2">
                                {getCurrentStages().map((stage, index) => (
                                    <div key={stage.id} className="bg-white p-3 rounded-lg border border-[#E5E0D2] flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 bg-[#EFEBE0] rounded-full flex items-center justify-center text-xs font-bold text-[#14213D]">
                                                {index + 1}
                                            </div>
                                            <span className="text-sm font-semibold text-[#14213D]">{stage.name}</span>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => moveStage(index, 'UP')} className="p-1 text-[#9E9D95] hover:text-[#14213D]"><IoChevronUpOutline /></button>
                                            <button onClick={() => moveStage(index, 'DOWN')} className="p-1 text-[#9E9D95] hover:text-[#14213D]"><IoChevronDownOutline /></button>
                                            <button onClick={() => removeStage(stage.id)} className="p-1 text-[#9E9D95] hover:text-[#B42626] ml-1"><IoTrashOutline /></button>
                                        </div>
                                    </div>
                                ))}
                                {getCurrentStages().length === 0 && (
                                    <p className="text-center text-xs text-[#9E9D95] py-4 italic">No stages defined.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-6 mt-4 border-t border-[#E5E0D2] shrink-0">
                <button
                    onClick={handleBack}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors ${step === 1 ? 'invisible' : 'bg-white border border-[#D8D2C2] text-[#14213D] hover:bg-[#FAF8F4]'}`}
                >
                    <IoArrowBack size={16} /> Back
                </button>

                <button
                    onClick={handleNext}
                    disabled={step === 1 && !localSettings.name}
                    className="bg-[#14213D] text-white rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-[#1F2D52] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {step === totalSteps ? 'Finish Setup' : 'Next Step'} <IoArrowForward size={16} />
                </button>
            </div>
        </div>
    </div>
  );
};

export default OnboardingPage;
