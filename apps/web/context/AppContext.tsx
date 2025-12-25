
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Member, Task, User, Stage, ChurchSettings, AutomationRule, IntegrationConfig, TaskPriority, PathwayType, Tenant, SystemLog } from '../types';
import { NEWCOMER_STAGES, NEW_BELIEVER_STAGES, DEFAULT_CHURCH_SETTINGS, DEFAULT_AUTOMATION_RULES, MOCK_TENANTS, MOCK_SYSTEM_LOGS } from '../constants';
import { checkAutomationRules } from '../services/automationService';
import { fetchSheetData, processIngestion } from '../services/ingestionService';
import * as authApi from '../src/api/auth';
import * as membersApi from '../src/api/members';
import * as tasksApi from '../src/api/tasks';
import * as settingsApi from '../src/api/settings';
import { tokenStorage } from '../src/api/client';

export type AuthStage = 'AUTH' | 'ONBOARDING' | 'APP';

interface AppContextType {
  authStage: AuthStage;
  currentUser: User | null;
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

  // Loading & Error States
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: (settings?: Partial<ChurchSettings>) => Promise<void>;

  addMembers: (newMembers: Member[]) => void;
  updateMember: (updatedMember: Member) => Promise<void>;
  toggleTask: (taskId: string) => Promise<void>;
  setChurchSettings: (settings: ChurchSettings) => void;
  setAutomationRules: (rules: AutomationRule[]) => void;
  setNewcomerStages: (stages: Stage[]) => void;
  setNewBelieverStages: (stages: Stage[]) => void;
  setIntegrations: (configs: IntegrationConfig[]) => void;
  syncIntegration: (config: IntegrationConfig) => Promise<void>;
  refreshData: () => Promise<void>;

  // Super Admin Actions
  updateTenantStatus: (id: string, status: 'Active' | 'Suspended') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Auth State
  const [authStage, setAuthStage] = useState<AuthStage>('AUTH');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Data State
  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [churchSettings, setChurchSettings] = useState<ChurchSettings>(DEFAULT_CHURCH_SETTINGS);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>(DEFAULT_AUTOMATION_RULES);
  const [newcomerStages, setNewcomerStages] = useState<Stage[]>(NEWCOMER_STAGES);
  const [newBelieverStages, setNewBelieverStages] = useState<Stage[]>(NEW_BELIEVER_STAGES);
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);

  // Super Admin State (still using mock data for now)
  const [tenants, setTenants] = useState<Tenant[]>(MOCK_TENANTS);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>(MOCK_SYSTEM_LOGS);

  // Loading & Error States
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const accessToken = tokenStorage.getAccessToken();
      if (accessToken) {
        try {
          setIsLoading(true);
          const user = await authApi.getCurrentUser();
          setCurrentUser(user as unknown as User);

          if (!user.onboardingComplete) {
            setAuthStage('ONBOARDING');
          } else {
            setAuthStage('APP');
            // Load initial data
            await refreshData();
          }
        } catch (err) {
          console.error('Session check failed:', err);
          tokenStorage.clearTokens();
          setAuthStage('AUTH');
        } finally {
          setIsLoading(false);
        }
      }
    };

    checkSession();
  }, []);

  // Refresh data from API
  const refreshData = async () => {
    if (!currentUser) return;

    try {
      setIsLoading(true);

      // Filter data based on user role
      const isVolunteer = currentUser.role === 'VOLUNTEER';
      const isTeamLeader = currentUser.role === 'TEAM_LEADER';

      let memberFilters = {};
      let taskFilters = {};

      // Volunteers only see their assigned members and tasks
      if (isVolunteer) {
        memberFilters = { assignedToId: currentUser.id };
        taskFilters = { assignedToId: currentUser.id };
      }
      // Team leaders can see all members and tasks (no filter)
      // Admins and Super Admins can see everything (no filter)

      const [fetchedMembers, fetchedTasks, fetchedSettings] = await Promise.all([
        membersApi.getMembers(memberFilters),
        tasksApi.getTasks(taskFilters),
        settingsApi.getSettings(),
      ]);

      setMembers(fetchedMembers as unknown as Member[]);
      setTasks(fetchedTasks as unknown as Task[]);
      setChurchSettings(fetchedSettings as unknown as ChurchSettings);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      console.error('Failed to refresh data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Auth Actions
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authApi.login({ email, password });
      setCurrentUser(response.user as unknown as User);

      if (!response.user.onboardingComplete) {
        setAuthStage('ONBOARDING');
      } else {
        setAuthStage('APP');
        // Load initial data
        await refreshData();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authApi.register({ email, password, firstName, lastName });
      setCurrentUser(response.user as unknown as User);
      setAuthStage('ONBOARDING');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await authApi.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setCurrentUser(null);
      setMembers([]);
      setTasks([]);
      setAuthStage('AUTH');
      setIsLoading(false);
    }
  };

  const completeOnboarding = async (settings?: Partial<ChurchSettings>) => {
    try {
      setIsLoading(true);
      setError(null);

      // Save church settings if provided
      if (settings) {
        // Convert service times format if needed
        const settingsData: any = {
          name: settings.name,
          denomination: settings.denomination,
          weeklyAttendance: settings.weeklyAttendance,
          address: settings.address,
          city: settings.city,
          country: settings.country,
        };

        // Convert service times to uppercase day format
        if (settings.serviceTimes && settings.serviceTimes.length > 0) {
          settingsData.serviceTimes = settings.serviceTimes.map((st: any) => ({
            day: st.day.toUpperCase(),
            time: st.time,
            name: st.name
          }));
        }

        const updatedSettings = await settingsApi.updateSettings(settingsData);
        setChurchSettings(updatedSettings as unknown as ChurchSettings);
      }

      const updatedUser = await authApi.completeOnboarding();
      setCurrentUser(updatedUser as unknown as User);
      setAuthStage('APP');
      // Load initial data
      await refreshData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete onboarding';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };


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

  const updateMember = async (updatedMember: Member) => {
    try {
      setError(null);
      // Update member via API
      const updated = await membersApi.updateMember(updatedMember.id, {
        firstName: updatedMember.firstName,
        lastName: updatedMember.lastName,
        email: updatedMember.email,
        phone: updatedMember.phone,
        pathway: updatedMember.pathway,
        status: updatedMember.status,
        assignedToId: updatedMember.assignedToId,
      });

      // Update local state
      setMembers(prev => prev.map(m => m.id === updated.id ? updated as unknown as Member : m));

      // Check for automation triggers
      const oldMember = members.find(m => m.id === updatedMember.id);
      if (oldMember && oldMember.currentStageId !== updatedMember.currentStageId && currentUser) {
        const newTasks = checkAutomationRules(updatedMember, automationRules, currentUser.id);

        if (newTasks.length > 0) {
          // Create tasks via API
          for (const task of newTasks) {
            await tasksApi.createTask({
              title: task.description || '',
              description: task.description,
              dueDate: task.dueDate,
              priority: task.priority,
              assignedToId: task.assignedToId,
              memberId: task.memberId,
            });
          }
          // Refresh tasks from API
          const fetchedTasks = await tasksApi.getTasks();
          setTasks(fetchedTasks as unknown as Task[]);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update member';
      setError(errorMessage);
      console.error('Failed to update member:', err);
      throw err;
    }
  };

  const toggleTask = async (taskId: string) => {
    try {
      setError(null);
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const wasCompleted = task.completed;

      // Toggle task completion via API
      if (!wasCompleted) {
        await tasksApi.completeTask(taskId);
      } else {
        await tasksApi.updateTask(taskId, { completed: false });
      }

      // Update local state
      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, completed: !wasCompleted } : t
      ));

      // Check Auto-Advance Rule for Task Completion
      if (!wasCompleted && task.memberId) {
        const member = members.find(m => m.id === task.memberId);
        if (member) {
          const stages = member.pathway === PathwayType.NEWCOMER ? newcomerStages : newBelieverStages;
          const currentStageIndex = stages.findIndex(s => s.id === member.currentStageId);
          const currentStage = stages[currentStageIndex];

          if (currentStage?.autoAdvanceRule?.type === 'TASK_COMPLETED') {
            const keyword = String(currentStage.autoAdvanceRule.value).toLowerCase();
            const taskDescription = task.description || '';
            if (taskDescription.toLowerCase().includes(keyword)) {
              // Advance Member
              if (currentStageIndex < stages.length - 1) {
                const nextStage = stages[currentStageIndex + 1];
                await updateMember({
                  ...member,
                  currentStageId: nextStage.id,
                  notes: [`[System] Auto-advanced to ${nextStage.name} upon completing task: "${taskDescription}"`, ...member.notes]
                });
              }
            }
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle task';
      setError(errorMessage);
      console.error('Failed to toggle task:', err);
      throw err;
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
      isLoading,
      error,
      login,
      register,
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
      refreshData,
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
