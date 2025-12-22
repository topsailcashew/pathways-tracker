
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Member, Task, User, Stage, ChurchSettings, AutomationRule, IntegrationConfig, TaskPriority, PathwayType, Tenant, SystemLog } from '../types';
import { MOCK_MEMBERS, MOCK_TASKS, CURRENT_USER, NEWCOMER_STAGES, NEW_BELIEVER_STAGES, DEFAULT_CHURCH_SETTINGS, DEFAULT_AUTOMATION_RULES, MOCK_TENANTS, MOCK_SYSTEM_LOGS } from '../constants';
import { checkAutomationRules } from '../services/automationService';
import { fetchSheetData, processIngestion } from '../services/ingestionService';

export type AuthStage = 'AUTH' | 'ONBOARDING' | 'APP';

interface AppContextType {
  authStage: AuthStage;
  currentUser: User;
  members: Member[];
  tasks: Task[];
  churchSettings: ChurchSettings;
  automationRules: AutomationRule[];
  newcomerStages: Stage[];
  newBelieverStages: Stage[];
  integrations: IntegrationConfig[];
  
  // Super Admin Data
  tenants: Tenant[];
  systemLogs: SystemLog[];
  
  // Actions
  login: (name: string, email: string, isNewUser: boolean) => void;
  logout: () => void;
  completeOnboarding: () => void;
  
  addMembers: (newMembers: Member[]) => void;
  updateMember: (updatedMember: Member) => void;
  toggleTask: (taskId: string) => void;
  setChurchSettings: (settings: ChurchSettings) => void;
  setAutomationRules: (rules: AutomationRule[]) => void;
  setNewcomerStages: (stages: Stage[]) => void;
  setNewBelieverStages: (stages: Stage[]) => void;
  setIntegrations: (configs: IntegrationConfig[]) => void;
  syncIntegration: (config: IntegrationConfig) => Promise<void>;
  
  // Super Admin Actions
  updateTenantStatus: (id: string, status: 'Active' | 'Suspended') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Auth State
  const [authStage, setAuthStage] = useState<AuthStage>('AUTH');
  const [currentUser, setCurrentUser] = useState<User>(CURRENT_USER);

  // Data State
  const [members, setMembers] = useState<Member[]>(MOCK_MEMBERS);
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [churchSettings, setChurchSettings] = useState<ChurchSettings>(DEFAULT_CHURCH_SETTINGS);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>(DEFAULT_AUTOMATION_RULES);
  const [newcomerStages, setNewcomerStages] = useState<Stage[]>(NEWCOMER_STAGES);
  const [newBelieverStages, setNewBelieverStages] = useState<Stage[]>(NEW_BELIEVER_STAGES);
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);

  // Super Admin State
  const [tenants, setTenants] = useState<Tenant[]>(MOCK_TENANTS);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>(MOCK_SYSTEM_LOGS);

  // Auth Actions
  const login = (name: string, email: string, isNewUser: boolean) => {
      // Create a dynamic user object based on login
      const user: User = {
          ...CURRENT_USER,
          id: `u-${Date.now()}`,
          name: name,
          firstName: name.split(' ')[0],
          lastName: name.split(' ')[1] || '',
          email: email,
          avatar: `https://ui-avatars.com/api/?name=${name.replace(' ', '+')}&background=random`
      };
      
      setCurrentUser(user);
      
      if (isNewUser) {
          setAuthStage('ONBOARDING');
          // Reset data for new user experience if desired, or keep mock data for demo purposes
      } else {
          setAuthStage('APP');
      }
  };

  const logout = () => {
      setAuthStage('AUTH');
  };

  const completeOnboarding = () => {
      setAuthStage('APP');
  };

  // Demo Data Injection (Run once when app loads)
  useEffect(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const hasUpcoming = tasks.some(t => !t.completed && (t.dueDate === todayStr || t.dueDate === tomorrowStr));
    
    if (!hasUpcoming && members.length > 0) {
        const demoTasks: Task[] = [
            {
                id: `demo-task-${Date.now()}-1`,
                memberId: members[0].id,
                description: 'Invite to Coffee (Notification Demo)',
                dueDate: todayStr,
                completed: false,
                priority: TaskPriority.HIGH,
                assignedToId: 'u1'
            },
            {
                id: `demo-task-${Date.now()}-2`,
                memberId: members[1] ? members[1].id : members[0].id,
                description: 'Send Welcome Packet',
                dueDate: tomorrowStr,
                completed: false,
                priority: TaskPriority.MEDIUM,
                assignedToId: 'u1'
            }
        ];
        setTasks(prev => [...demoTasks, ...prev]);
    }
  }, []);

  // Time-based Auto Advance Check (Run on mount or periodically)
  useEffect(() => {
    const checkTimeBasedAdvancement = () => {
        let membersUpdated = false;
        const updatedMembers = members.map(member => {
            const stages = member.pathway === PathwayType.NEWCOMER ? newcomerStages : newBelieverStages;
            const currentStageIndex = stages.findIndex(s => s.id === member.currentStageId);
            const currentStage = stages[currentStageIndex];

            if (currentStage?.autoAdvanceRule?.type === 'TIME_IN_STAGE' && member.lastStageChangeDate) {
                const daysThreshold = Number(currentStage.autoAdvanceRule.value);
                const lastChange = new Date(member.lastStageChangeDate);
                const now = new Date();
                const diffTime = Math.abs(now.getTime() - lastChange.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays >= daysThreshold && currentStageIndex < stages.length - 1) {
                    const nextStage = stages[currentStageIndex + 1];
                    membersUpdated = true;
                    return {
                        ...member,
                        currentStageId: nextStage.id,
                        lastStageChangeDate: now.toISOString().split('T')[0],
                        notes: [`[System] Auto-advanced to ${nextStage.name} after ${daysThreshold} days in ${currentStage.name}`, ...member.notes]
                    };
                }
            }
            return member;
        });

        if (membersUpdated) {
            setMembers(updatedMembers);
        }
    };

    // Run check 1s after load to ensure data is settled, and mock real-time check
    const timer = setTimeout(checkTimeBasedAdvancement, 1000);
    return () => clearTimeout(timer);
  }, [members, newcomerStages, newBelieverStages]);

  // Actions
  const addMembers = (newMembers: Member[]) => {
      setMembers(prev => [...newMembers, ...prev]);
  };

  const updateMember = (updatedMember: Member) => {
    // Check for automation triggers
    const oldMember = members.find(m => m.id === updatedMember.id);
    let memberToSave = updatedMember;

    if (oldMember && oldMember.currentStageId !== updatedMember.currentStageId) {
        // Update timestamp if stage changed
        memberToSave.lastStageChangeDate = new Date().toISOString().split('T')[0];

        const newTasks = checkAutomationRules(updatedMember, automationRules, currentUser.id);
        
        if (newTasks.length > 0) {
             setTasks(prev => [...newTasks, ...prev]);
             // Add system note
             const notesToAdd = newTasks.map(t => `[System] Auto-created task: "${t.description}"`);
             memberToSave = {
                 ...memberToSave,
                 notes: [...memberToSave.notes, ...notesToAdd]
             };
        }
    }

    setMembers(prev => prev.map(m => m.id === memberToSave.id ? memberToSave : m));
  };

  const toggleTask = (taskId: string) => {
    let taskCompleted = false;
    let targetTask: Task | undefined;

    setTasks(prev => prev.map(t => {
        if (t.id === taskId) {
            targetTask = t;
            taskCompleted = !t.completed;
            return { ...t, completed: !t.completed };
        }
        return t;
    }));

    // Check Auto-Advance Rule for Task Completion
    if (targetTask && taskCompleted) { // Only if marking as COMPLETE
        const member = members.find(m => m.id === targetTask!.memberId);
        if (member) {
            const stages = member.pathway === PathwayType.NEWCOMER ? newcomerStages : newBelieverStages;
            const currentStageIndex = stages.findIndex(s => s.id === member.currentStageId);
            const currentStage = stages[currentStageIndex];

            if (currentStage?.autoAdvanceRule?.type === 'TASK_COMPLETED') {
                const keyword = String(currentStage.autoAdvanceRule.value).toLowerCase();
                if (targetTask.description.toLowerCase().includes(keyword)) {
                    // Logic match! Advance Member.
                    if (currentStageIndex < stages.length - 1) {
                        const nextStage = stages[currentStageIndex + 1];
                        updateMember({
                            ...member,
                            currentStageId: nextStage.id,
                            notes: [`[System] Auto-advanced to ${nextStage.name} upon completing task: "${targetTask.description}"`, ...member.notes]
                        });
                    }
                }
            }
        }
    }
  };

  const syncIntegration = async (config: IntegrationConfig) => {
      const rawData = await fetchSheetData(config.sheetUrl);
      const { newMembers, newTasks } = processIngestion(rawData, config, members);
      
      if(newMembers.length > 0) {
          setMembers(prev => [...newMembers, ...prev]);
          setTasks(prev => [...newTasks, ...prev]);
          
          const updatedInts = integrations.map(i => i.id === config.id ? { ...i, lastSync: new Date().toISOString() } : i);
          setIntegrations(updatedInts);
          
          alert(`Sync Complete: Imported ${newMembers.length} new people from ${config.sourceName}.`);
      } else {
          alert(`Sync Complete: No new entries found in ${config.sourceName}.`);
      }
  };

  const updateTenantStatus = (id: string, status: 'Active' | 'Suspended') => {
      setTenants(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  };

  return (
    <AppContext.Provider value={{
      authStage,
      currentUser,
      members,
      tasks,
      churchSettings,
      automationRules,
      newcomerStages,
      newBelieverStages,
      integrations,
      tenants,
      systemLogs,
      login,
      logout,
      completeOnboarding,
      addMembers,
      updateMember,
      toggleTask,
      setChurchSettings,
      setAutomationRules,
      setNewcomerStages,
      setNewBelieverStages,
      setIntegrations,
      syncIntegration,
      updateTenantStatus
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
