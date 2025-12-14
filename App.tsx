
import React, { useState, useEffect } from 'react';
import { IoMenuOutline } from 'react-icons/io5';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PeopleList from './components/PeopleList';
import PathwaysPage from './components/PathwaysPage';
import TaskList from './components/TaskList';
import MemberDetail from './components/MemberDetail';
import ProfilePage from './components/ProfilePage';
import SettingsPage from './components/SettingsPage';
import NotificationCenter from './components/NotificationCenter';
import { Member, Task, ViewState, Stage, TaskPriority, ChurchSettings, AutomationRule, IntegrationConfig } from './types';
import { MOCK_MEMBERS, MOCK_TASKS, CURRENT_USER, NEWCOMER_STAGES, NEW_BELIEVER_STAGES, DEFAULT_CHURCH_SETTINGS, DEFAULT_AUTOMATION_RULES } from './constants';
import { fetchSheetData, processIngestion } from './services/ingestionService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const [members, setMembers] = useState<Member[]>(MOCK_MEMBERS);
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Settings State
  const [newcomerStages, setNewcomerStages] = useState<Stage[]>(NEWCOMER_STAGES);
  const [newBelieverStages, setNewBelieverStages] = useState<Stage[]>(NEW_BELIEVER_STAGES);
  const [churchSettings, setChurchSettings] = useState<ChurchSettings>(DEFAULT_CHURCH_SETTINGS);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>(DEFAULT_AUTOMATION_RULES);
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);

  // Ensure we have some tasks due today/tomorrow for demo purposes of the notification feature
  useEffect(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Check if any task matches today or tomorrow
    const hasUpcoming = tasks.some(t => !t.completed && (t.dueDate === todayStr || t.dueDate === tomorrowStr));
    
    if (!hasUpcoming && members.length > 0) {
        // Inject demo tasks
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
  }, []); // Run once on mount

  // Handlers
  const handleToggleTask = (taskId: string) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    ));
  };

  const checkAutomation = (updatedMember: Member) => {
      // Find rules that match the new stage
      const matchingRules = automationRules.filter(r => r.enabled && r.stageId === updatedMember.currentStageId);
      
      if (matchingRules.length > 0) {
          const newTasks: Task[] = matchingRules.map(rule => {
              const dueDate = new Date();
              dueDate.setDate(dueDate.getDate() + rule.daysDue);
              
              return {
                  id: `auto-task-${Date.now()}-${rule.id}`,
                  memberId: updatedMember.id,
                  description: rule.taskDescription,
                  dueDate: dueDate.toISOString().split('T')[0],
                  priority: rule.priority,
                  completed: false,
                  assignedToId: CURRENT_USER.id // Default to current user for now
              };
          });

          setTasks(prev => [...newTasks, ...prev]);
          // Optional: Add note to member that task was auto-created
          const updatedNotes = [...updatedMember.notes, ...newTasks.map(t => `[System] Auto-created task: "${t.description}"`)];
          updatedMember.notes = updatedNotes;
      }
      return updatedMember;
  };

  const handleUpdateMember = (updatedMember: Member) => {
    // 1. Check for State Changes relative to old state
    const oldMember = members.find(m => m.id === updatedMember.id);
    let memberToSave = updatedMember;

    if (oldMember && oldMember.currentStageId !== updatedMember.currentStageId) {
        // Stage changed, check automation
        memberToSave = checkAutomation(updatedMember);
    }

    setMembers(prev => prev.map(m => m.id === memberToSave.id ? memberToSave : m));
    
    // Update selected member view if open
    if (selectedMember && selectedMember.id === memberToSave.id) {
        setSelectedMember(memberToSave);
    }
  };

  const handleAddMembers = (newMembers: Member[]) => {
      setMembers(prev => [...newMembers, ...prev]);
  };

  // Integration Logic
  const handleSyncIntegration = async (config: IntegrationConfig) => {
      try {
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
      } catch (e) {
          console.error(e);
          alert('Failed to sync. Check URL.');
      }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'DASHBOARD':
        return <Dashboard members={members} tasks={tasks} newcomerStages={newcomerStages} newBelieverStages={newBelieverStages} />;
      case 'PEOPLE':
        return (
            <PeopleList 
                members={members} 
                onSelectMember={setSelectedMember} 
                onAddMembers={handleAddMembers}
                newcomerStages={newcomerStages}
                newBelieverStages={newBelieverStages}
                churchSettings={churchSettings}
            />
        );
      case 'PATHWAYS':
        return (
            <PathwaysPage 
                members={members}
                newcomerStages={newcomerStages}
                newBelieverStages={newBelieverStages}
                onSelectMember={setSelectedMember}
                onUpdateMember={handleUpdateMember}
            />
        );
      case 'TASKS':
        return <TaskList tasks={tasks} members={members} onToggleTask={handleToggleTask} />;
      case 'PROFILE':
        return (
            <ProfilePage 
                user={CURRENT_USER}
                assignedMembersCount={members.filter(m => m.assignedToId === CURRENT_USER.id).length}
                assignedTasksCount={tasks.filter(t => t.assignedToId === CURRENT_USER.id && !t.completed).length}
            />
        );
      case 'SETTINGS':
        return (
            <SettingsPage 
                newcomerStages={newcomerStages}
                setNewcomerStages={setNewcomerStages}
                newBelieverStages={newBelieverStages}
                setNewBelieverStages={setNewBelieverStages}
                churchSettings={churchSettings}
                setChurchSettings={setChurchSettings}
                automationRules={automationRules}
                setAutomationRules={setAutomationRules}
                integrations={integrations}
                setIntegrations={setIntegrations}
                onSyncIntegration={handleSyncIntegration}
            />
        );
      default:
        return <Dashboard members={members} tasks={tasks} newcomerStages={newcomerStages} newBelieverStages={newBelieverStages} />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex font-sans text-slate-800">
      
      {/* Navigation */}
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView}
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        churchName={churchSettings.name}
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        
        {/* Unified Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm">
           <div className="flex items-center gap-3">
              <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-gray-600 hover:bg-gray-100 p-2 rounded-lg">
                <IoMenuOutline size={24} />
              </button>
              <h1 className="text-xl font-bold text-gray-800 capitalize">
                  {currentView === 'DASHBOARD' ? 'Overview' : 
                   currentView === 'PEOPLE' ? 'People Directory' : 
                   currentView === 'PATHWAYS' ? 'Pathways' :
                   currentView === 'TASKS' ? 'My Tasks' : 
                   currentView === 'PROFILE' ? 'My Profile' : 'Settings'}
              </h1>
           </div>

           <div className="flex items-center gap-4">
               {/* Notification Center */}
               <NotificationCenter tasks={tasks} members={members} />
               
               {/* Small Profile Avatar for Desktop context */}
               <div className="hidden md:block w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs border-2 border-ocean cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setCurrentView('PROFILE')}>
                   {CURRENT_USER.name.charAt(0)}
               </div>
           </div>
        </header>

        {/* View Content */}
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          {renderContent()}
        </div>

      </main>

      {/* Member Detail Modal */}
      {selectedMember && (
        <MemberDetail 
          member={selectedMember} 
          onClose={() => setSelectedMember(null)} 
          onUpdateMember={handleUpdateMember}
          newcomerStages={newcomerStages}
          newBelieverStages={newBelieverStages}
        />
      )}

      {/* Tailwind Animations Customization */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes zoomIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out;
        }
        .animate-slide-in-right {
          animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .animate-zoom-in {
          animation: zoomIn 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default App;
