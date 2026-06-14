
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
          case 'ACADEMY': return 'Shepherd Academy';
          default: return 'Dashboard';
      }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F4] flex font-sans text-[#14213D]">
      <Sidebar
        currentView={currentView}
        onViewChange={onViewChange}
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        churchName={churchSettings.name}
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <main className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-60'}`}>
        {/* Header */}
        <header className="bg-[#FAF8F4] border-b border-[#E5E0D2] px-4 py-3 flex items-center justify-between sticky top-0 z-20">
           <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden text-[#6B6960] hover:bg-black/[0.06] p-2 rounded-lg transition-colors"
              >
                <IoMenuOutline size={22} />
              </button>
              <h1 className="text-base font-semibold text-[#14213D]">
                  {getTitle()}
              </h1>
           </div>

           <div className="flex items-center gap-3">
               <NotificationCenter tasks={tasks} members={members} />
               {currentUser && (
                 <button
<<<<<<< HEAD
                   className="hidden md:block w-9 h-9 rounded-full border-2 border-ocean cursor-pointer hover:opacity-90 transition-opacity overflow-hidden bg-primary flex items-center justify-center flex-shrink-0"
=======
                   className="hidden md:flex w-8 h-8 rounded-full bg-[#14213D] text-white items-center justify-center text-xs font-semibold cursor-pointer hover:opacity-90 transition-opacity overflow-hidden shrink-0 border border-[#D8D2C2]"
>>>>>>> b1322ac
                   onClick={() => onViewChange('PROFILE')}
                 >
                   {currentUser.avatar ? (
                     <img
                       src={currentUser.avatar}
                       alt={`${currentUser.firstName} ${currentUser.lastName}`}
                       className="w-full h-full object-cover"
                       onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                     />
                   ) : (
<<<<<<< HEAD
                     <span className="text-white font-bold text-xs">
=======
                     <span>
>>>>>>> b1322ac
                       {currentUser.firstName?.charAt(0) || currentUser.name?.charAt(0)}
                     </span>
                   )}
                 </button>
               )}
           </div>
        </header>

        {/* View Content */}
        <div className="p-4 md:px-10 md:py-8 max-w-7xl mx-auto w-full">
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
