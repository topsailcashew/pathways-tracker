import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Member, Task, User, Stage, ChurchSettings, AutomationRule, IntegrationConfig, PathwayType, Tenant, SystemLog } from '../types';
import { NEWCOMER_STAGES, NEW_BELIEVER_STAGES, DEFAULT_CHURCH_SETTINGS, DEFAULT_AUTOMATION_RULES } from '../constants';
import { checkAutomationRules } from '../services/automationService';
import { fetchSheetData, processIngestion } from '../services/ingestionService';
import * as authApi from '../src/api/auth';
import * as membersApi from '../src/api/members';
import * as tasksApi from '../src/api/tasks';
import * as settingsApi from '../src/api/settings';
import * as stagesApi from '../src/api/stages';
import supabase from '../src/lib/supabase';

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

  // Auth Actions
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, metadata?: { firstName?: string; lastName?: string }) => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: (settings?: Partial<ChurchSettings>) => Promise<void>;

  // Data Actions
  addMembers: (newMembers: Member[]) => void;
  updateMember: (updatedMember: Member) => Promise<void>;
  toggleTask: (taskId: string) => Promise<void>;
  setChurchSettings: (settings: ChurchSettings) => void;
  saveChurchSettings: (settings: ChurchSettings) => Promise<void>;
  setAutomationRules: (rules: AutomationRule[]) => void;
  setNewcomerStages: (stages: Stage[]) => void;
  setNewBelieverStages: (stages: Stage[]) => void;
  setIntegrations: (configs: IntegrationConfig[]) => void;
  syncIntegration: (config: IntegrationConfig) => Promise<void>;
  refreshData: () => Promise<void>;
  refreshMembers: () => Promise<void>;

  // Stage CRUD
  apiCreateStage: (data: stagesApi.CreateStageData) => Promise<stagesApi.Stage>;
  apiUpdateStage: (id: string, data: stagesApi.UpdateStageData) => Promise<stagesApi.Stage>;
  apiDeleteStage: (id: string) => Promise<void>;
  apiReorderStages: (pathway: 'NEWCOMER' | 'NEW_BELIEVER', reorders: stagesApi.ReorderStageData[]) => Promise<void>;

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
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);

  // Loading & Error States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to load stages from DB and set state
  const loadStagesFromDb = async () => {
    try {
      const allStages = await stagesApi.getStages();
      const ncStages = allStages
        .filter(s => s.pathway === 'NEWCOMER')
        .sort((a, b) => a.order - b.order)
        .map(s => ({
          id: s.id,
          name: s.name,
          order: s.order,
          description: s.description,
          autoAdvanceRule: s.autoAdvanceEnabled && s.autoAdvanceType ? {
            type: s.autoAdvanceType as 'TASK_COMPLETED' | 'TIME_IN_STAGE',
            value: s.autoAdvanceType === 'TIME_IN_STAGE' ? Number(s.autoAdvanceValue || 0) : (s.autoAdvanceValue || '')
          } : undefined,
        }));
      const nbStages = allStages
        .filter(s => s.pathway === 'NEW_BELIEVER')
        .sort((a, b) => a.order - b.order)
        .map(s => ({
          id: s.id,
          name: s.name,
          order: s.order,
          description: s.description,
          autoAdvanceRule: s.autoAdvanceEnabled && s.autoAdvanceType ? {
            type: s.autoAdvanceType as 'TASK_COMPLETED' | 'TIME_IN_STAGE',
            value: s.autoAdvanceType === 'TIME_IN_STAGE' ? Number(s.autoAdvanceValue || 0) : (s.autoAdvanceValue || '')
          } : undefined,
        }));
      if (ncStages.length > 0) setNewcomerStages(ncStages);
      if (nbStages.length > 0) setNewBelieverStages(nbStages);
    } catch (err) {
      console.warn('Failed to load stages from DB, using defaults:', err);
    }
  };

  // Sync user with backend after Supabase auth
  const syncUserWithBackend = async (): Promise<void> => {
    try {
      // Fire all requests in parallel — don't wait for syncUser before loading data
      const [result, fetchedMembers, fetchedTasks, fetchedSettings] = await Promise.all([
        authApi.syncUser(),
        membersApi.getMembers(),
        tasksApi.getTasks(),
        settingsApi.getSettings(),
      ]);

      const user = result.user;
      setCurrentUser(user as unknown as User);

      if (!user.onboardingComplete) {
        setAuthStage('ONBOARDING');
        return;
      }

      setAuthStage('APP');

      // If volunteer, re-fetch with filters (rare path)
      if (user.role === 'VOLUNTEER') {
        const [filteredMembers, filteredTasks] = await Promise.all([
          membersApi.getMembers({ assignedToId: user.id }),
          tasksApi.getTasks({ assignedToId: user.id }),
        ]);
        setMembers(filteredMembers as unknown as Member[]);
        setTasks(filteredTasks as unknown as Task[]);
      } else {
        setMembers(fetchedMembers as unknown as Member[]);
        setTasks(fetchedTasks as unknown as Task[]);
      }
      setChurchSettings(fetchedSettings as unknown as ChurchSettings);

      // Load stages from DB (non-blocking)
      loadStagesFromDb();
    } catch (err) {
      console.error('Failed to sync user with backend:', err);
      setError('Failed to connect to server. Please try again.');
      setAuthStage('AUTH');
    }
  };

  // Initialize auth on mount
  useEffect(() => {
    let mounted = true;

    // Check for existing session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!mounted) return;
        if (session) {
          syncUserWithBackend().finally(() => {
            if (mounted) setIsLoading(false);
          });
        } else {
          setAuthStage('AUTH');
          setIsLoading(false);
        }
      })
      .catch((err) => {
        // Handle AbortError from Strict Mode unmount
        if (!mounted) return;
        console.error('[Auth] getSession error:', err);
        setAuthStage('AUTH');
        setIsLoading(false);
      });

    // Listen for future auth changes (non-async to avoid AbortError)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      console.log('[Auth] State changed:', event);

      if (event === 'SIGNED_IN' && session) {
        setIsLoading(true);
        syncUserWithBackend()
          .then(() => console.log('[Auth] Sync successful'))
          .catch((err) => console.error('[Auth] Sync failed:', err))
          .finally(() => { if (mounted) setIsLoading(false); });
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setMembers([]);
        setTasks([]);
        setAuthStage('AUTH');
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Refresh data from API
  const refreshData = async () => {
    if (!currentUser) return;

    try {
      setIsLoading(true);

      // Filter data based on user role
      const isVolunteer = currentUser.role === 'VOLUNTEER';

      let memberFilters = {};
      let taskFilters = {};

      // Volunteers only see their assigned members and tasks
      if (isVolunteer) {
        memberFilters = { assignedToId: currentUser.id };
        taskFilters = { assignedToId: currentUser.id };
      }

      const [fetchedMembers, fetchedTasks, fetchedSettings] = await Promise.all([
        membersApi.getMembers(memberFilters),
        tasksApi.getTasks(taskFilters),
        settingsApi.getSettings(),
      ]);

      setMembers(fetchedMembers as unknown as Member[]);
      setTasks(fetchedTasks as unknown as Task[]);
      setChurchSettings(fetchedSettings as unknown as ChurchSettings);
      setError(null);

      // Also refresh stages
      loadStagesFromDb();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      console.error('Failed to refresh data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Save church settings to the database
  const saveChurchSettings = async (settings: ChurchSettings) => {
    try {
      setError(null);
      const settingsData: any = {
        name: settings.name,
        denomination: settings.denomination,
      };

      if (settings.serviceTimes && settings.serviceTimes.length > 0) {
        settingsData.serviceTimes = settings.serviceTimes.map((st: any) => ({
          day: st.day.toUpperCase(),
          time: st.time,
          name: st.name,
        }));
      }

      const updated = await settingsApi.updateSettings(settingsData);
      setChurchSettings(updated as unknown as ChurchSettings);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save settings';
      setError(errorMessage);
      console.error('Failed to save church settings:', err);
      throw err;
    }
  };

  // Auth Actions
  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) throw error;
      // Auth state change listener will handle the rest
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Google sign-in failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('[Auth] Attempting sign in for:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[Auth] Sign in error:', error);
        throw error;
      }

      console.log('[Auth] Sign in successful, session:', data.session ? 'yes' : 'no');
      // Auth state change listener will handle the rest
    } catch (err: any) {
      const errorMessage = err?.message || 'Sign-in failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    metadata?: { firstName?: string; lastName?: string }
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: metadata ? `${metadata.firstName || ''} ${metadata.lastName || ''}`.trim() : undefined,
          },
        },
      });

      if (error) throw error;

      // Check if email confirmation is required
      if (data.user && !data.session) {
        // Email confirmation is required
        setError('Please check your email to confirm your account before signing in.');
        setIsLoading(false);
        return;
      }

      // If we have a session, the auth state change listener will handle the rest
      console.log('[Auth] Sign up successful, session:', data.session ? 'yes' : 'no');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign-up failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      await authApi.logout();
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
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
      await refreshData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete onboarding';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Time-based Auto Advance Check
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

    const timer = setTimeout(checkTimeBasedAdvancement, 1000);
    return () => clearTimeout(timer);
  }, [members, newcomerStages, newBelieverStages]);

  // Refresh members from API
  const refreshMembers = async () => {
    try {
      const isVolunteer = currentUser?.role === 'Volunteer';
      const filters = isVolunteer && currentUser ? { assignedToId: currentUser.id } : {};
      const fetched = await membersApi.getMembers(filters);
      setMembers(fetched as unknown as Member[]);
    } catch (err) {
      console.error('Failed to refresh members:', err);
    }
  };

  // Stage CRUD helpers
  const apiCreateStage = async (data: stagesApi.CreateStageData) => {
    const created = await stagesApi.createStage(data);
    await loadStagesFromDb();
    return created;
  };

  const apiUpdateStage = async (id: string, data: stagesApi.UpdateStageData) => {
    const updated = await stagesApi.updateStage(id, data);
    await loadStagesFromDb();
    return updated;
  };

  const apiDeleteStage = async (id: string) => {
    await stagesApi.deleteStage(id);
    await loadStagesFromDb();
  };

  const apiReorderStages = async (pathway: 'NEWCOMER' | 'NEW_BELIEVER', reorders: stagesApi.ReorderStageData[]) => {
    await stagesApi.reorderStages(pathway, reorders);
    await loadStagesFromDb();
  };

  // Data Actions
  const addMembers = (newMembers: Member[]) => {
      setMembers(prev => [...newMembers, ...prev]);
  };

  const updateMember = async (updatedMember: Member) => {
    try {
      setError(null);
      // Build update payload with all defined fields
      const payload: membersApi.UpdateMemberData = {};
      if (updatedMember.firstName !== undefined) payload.firstName = updatedMember.firstName;
      if (updatedMember.lastName !== undefined) payload.lastName = updatedMember.lastName;
      if (updatedMember.email !== undefined) payload.email = updatedMember.email;
      if (updatedMember.phone !== undefined) payload.phone = updatedMember.phone;
      if (updatedMember.pathway !== undefined) payload.pathway = updatedMember.pathway === PathwayType.NEWCOMER ? 'NEWCOMER' : 'NEW_BELIEVER';
      if (updatedMember.status !== undefined) payload.status = updatedMember.status;
      if (updatedMember.assignedToId !== undefined) payload.assignedToId = updatedMember.assignedToId;
      if (updatedMember.address !== undefined) payload.address = updatedMember.address;
      if (updatedMember.city !== undefined) payload.city = updatedMember.city;
      if (updatedMember.state !== undefined) payload.state = updatedMember.state;
      if (updatedMember.zip !== undefined) payload.zip = updatedMember.zip;
      if (updatedMember.dateOfBirth !== undefined) payload.dateOfBirth = updatedMember.dateOfBirth;
      if (updatedMember.gender !== undefined) payload.gender = updatedMember.gender;
      if (updatedMember.maritalStatus !== undefined) payload.maritalStatus = updatedMember.maritalStatus;
      if (updatedMember.nationality !== undefined) payload.nationality = updatedMember.nationality;
      if (updatedMember.spouseName !== undefined) payload.spouseName = updatedMember.spouseName;
      if (updatedMember.spouseDob !== undefined) payload.spouseDob = updatedMember.spouseDob;
      if (updatedMember.emergencyContact !== undefined) payload.emergencyContact = updatedMember.emergencyContact;
      if (updatedMember.titheNumber !== undefined) payload.titheNumber = updatedMember.titheNumber;
      if (updatedMember.isChurchMember !== undefined) payload.isChurchMember = updatedMember.isChurchMember;
      if (updatedMember.familyId !== undefined) payload.familyId = updatedMember.familyId || '';
      if (updatedMember.familyRole !== undefined) payload.familyRole = updatedMember.familyRole;

      const updated = await membersApi.updateMember(updatedMember.id, payload);

      setMembers(prev => prev.map(m => m.id === updated.id ? updated as unknown as Member : m));

      // Check for automation triggers
      const oldMember = members.find(m => m.id === updatedMember.id);
      if (oldMember && oldMember.currentStageId !== updatedMember.currentStageId && currentUser) {
        const newTasks = checkAutomationRules(updatedMember, automationRules, currentUser.id);

        if (newTasks.length > 0) {
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

      if (!wasCompleted) {
        await tasksApi.completeTask(taskId);
      } else {
        await tasksApi.updateTask(taskId, { completed: false });
      }

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
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signOut,
      completeOnboarding,
      addMembers,
      updateMember,
      toggleTask,
      setChurchSettings,
      saveChurchSettings,
      setAutomationRules,
      setNewcomerStages,
      setNewBelieverStages,
      setIntegrations,
      syncIntegration,
      refreshData,
      refreshMembers,
      apiCreateStage,
      apiUpdateStage,
      apiDeleteStage,
      apiReorderStages,
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
