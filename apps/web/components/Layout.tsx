
import React, { useState } from 'react';
import { IoMenuOutline } from 'react-icons/io5';
import { Sidebar } from './Sidebar';
import NotificationCenter from './NotificationCenter';
import { useAppContext } from '../context/AppContext';
import { ViewState } from '../types';

interface LayoutProps {
  currentView: ViewState;
  onViewChange: (view: ViewState) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ currentView, onViewChange, children }) => {
  const { churchSettings, currentUser, tasks, members } = useAppContext();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const getTitle = () => {
      switch(currentView) {
          case 'DASHBOARD': return 'Overview';
          case 'PEOPLE': return 'Pathway Walkers';
          case 'MEMBERS': return churchSettings.memberTerm || 'Members Directory';
          case 'PATHWAYS': return 'Pathway Board';
          case 'TASKS': return 'My Tasks';
          case 'PROFILE': return 'My Profile';
          case 'SETTINGS': return 'Settings';
          default: return 'Dashboard';
      }
  };

  return (
    <div className="min-h-screen bg-background flex font-sans text-slate-800">
      <Sidebar 
        currentView={currentView} 
        onViewChange={onViewChange}
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        churchName={churchSettings.name}
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <main className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm">
           <div className="flex items-center gap-3">
              <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-gray-600 hover:bg-gray-100 p-2 rounded-lg">
                <IoMenuOutline size={24} />
              </button>
              <h1 className="text-xl font-bold text-gray-800 capitalize">
                  {getTitle()}
              </h1>
           </div>

           <div className="flex items-center gap-4">
               <NotificationCenter tasks={tasks} members={members} />
               {currentUser && (
                 <div className="hidden md:block w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs border-2 border-ocean cursor-pointer hover:opacity-90 transition-opacity" onClick={() => onViewChange('PROFILE')}>
                     {currentUser.firstName?.charAt(0) || currentUser.name?.charAt(0)}
                 </div>
               )}
           </div>
        </header>

        {/* View Content */}
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>

       {/* Tailwind Animations */}
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

export default Layout;
