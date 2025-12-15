
import React from 'react';
import { IoGridOutline, IoPeopleOutline, IoCheckboxOutline, IoSettingsOutline, IoLogOutOutline, IoChevronBackOutline, IoChevronForwardOutline, IoGitNetworkOutline } from 'react-icons/io5';
import { ViewState } from '../types';
import { useAppContext } from '../context/AppContext';

interface SidebarProps {
  currentView: ViewState;
  onViewChange: (view: ViewState) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
  churchName: string;
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, isOpen, toggleSidebar, churchName, isCollapsed, toggleCollapse }) => {
  const { currentUser, logout } = useAppContext();

  const navItems = [
    { id: 'DASHBOARD', label: 'Overview', icon: IoGridOutline },
    { id: 'PEOPLE', label: 'People', icon: IoPeopleOutline },
    { id: 'PATHWAYS', label: 'Pathways', icon: IoGitNetworkOutline },
    { id: 'TASKS', label: 'My Tasks', icon: IoCheckboxOutline },
  ];

  const handleLogout = () => {
      if(window.confirm('Are you sure you want to sign out?')) {
          logout();
      }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-30 h-screen bg-navy text-white transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
        ${isCollapsed ? 'w-20' : 'w-64'}
        flex flex-col shadow-xl
      `}>
        {/* Collapse Toggle (Desktop Only) */}
        <button 
            onClick={toggleCollapse}
            className="hidden md:flex absolute -right-3 top-8 bg-primary text-white p-1 rounded-full border border-navy shadow-lg z-50 hover:bg-ocean transition-colors"
        >
            {isCollapsed ? <IoChevronForwardOutline size={14} /> : <IoChevronBackOutline size={14} />}
        </button>

        <div className={`p-6 border-b border-white/10 min-h-[88px] flex flex-col justify-center ${isCollapsed ? 'items-center px-2' : ''}`}>
          {!isCollapsed ? (
              <div className="animate-fade-in">
                <h1 className="text-xl font-bold tracking-tight leading-tight mb-1 truncate w-full">{churchName}</h1>
                <div className="flex items-center gap-1.5 opacity-60">
                    <div className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                    <p className="text-[10px] uppercase tracking-wider font-semibold truncate">Pathway Tracker</p>
                </div>
              </div>
          ) : (
             <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center font-bold text-lg text-white border border-white/10">
                 {churchName.charAt(0)}
             </div>
          )}
        </div>

        <nav className="flex-1 px-3 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onViewChange(item.id as ViewState);
                  if (window.innerWidth < 768) toggleSidebar();
                }}
                className={`
                  w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'space-x-3 px-4'} py-3 rounded-lg transition-all duration-200
                  ${isActive ? 'bg-primary text-white shadow-lg shadow-black/20' : 'text-secondary hover:bg-primary/50 hover:text-white'}
                `}
                title={isCollapsed ? item.label : ''}
              >
                <Icon size={22} />
                {!isCollapsed && <span className="font-medium animate-fade-in">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-1">
          <button 
             onClick={() => {
               onViewChange('PROFILE');
               if (window.innerWidth < 768) toggleSidebar();
             }}
             className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3 px-2'} py-2 rounded-lg w-full text-left transition-colors ${currentView === 'PROFILE' ? 'bg-primary' : 'hover:bg-primary/50'}`}
             title={isCollapsed ? 'My Profile' : ''}
          >
            <img src={currentUser.avatar} alt="User" className="w-8 h-8 rounded-full border-2 border-ocean object-cover shrink-0" />
            {!isCollapsed && (
                <div className="truncate animate-fade-in">
                  <p className="text-sm font-semibold text-white truncate">{currentUser.name}</p>
                  <p className="text-xs text-ocean truncate">{currentUser.role}</p>
                </div>
            )}
          </button>
          
          <button 
             onClick={() => {
               onViewChange('SETTINGS');
               if (window.innerWidth < 768) toggleSidebar();
             }}
             className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3 px-4'} py-2 text-sm text-secondary hover:text-white transition-colors w-full rounded-lg ${currentView === 'SETTINGS' ? 'text-white' : ''}`}
             title={isCollapsed ? 'Settings' : ''}
          >
            <IoSettingsOutline size={20} />
            {!isCollapsed && <span className="animate-fade-in">Settings</span>}
          </button>
          
          <button 
            onClick={handleLogout}
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3 px-4'} py-2 text-sm text-secondary hover:text-white transition-colors w-full rounded-lg`}
            title={isCollapsed ? 'Sign Out' : ''}
          >
            <IoLogOutOutline size={20} />
            {!isCollapsed && <span className="animate-fade-in">Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
