
import React from 'react';
import { IoGridOutline, IoPeopleOutline, IoCheckboxOutline, IoSettingsOutline, IoLogOutOutline, IoChevronBackOutline, IoChevronForwardOutline, IoGitNetworkOutline, IoIdCardOutline, IoShieldCheckmarkOutline, IoHeartOutline, IoServerOutline, IoDocumentTextOutline, IoSchoolOutline } from 'react-icons/io5';
import { ViewState } from '../types';
import { useAppContext } from '../context/AppContext';
import { usePermissions } from '../src/hooks/usePermissions';
import { Permission } from '../src/utils/permissions';

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
  const { currentUser, signOut } = useAppContext();
  const { can, isSuperAdmin, isAdmin, isTeamLeader } = usePermissions();

  // Build navigation items based on permissions
  const navItems = [];

  // Dashboard - available to all
  navItems.push({ id: 'DASHBOARD', label: 'Overview', icon: IoGridOutline });

  // Pathways - available to all
  navItems.push({ id: 'PEOPLE', label: 'Pathways', icon: IoPeopleOutline });

  // Members - available to all (filtered by role in backend)
  navItems.push({ id: 'MEMBERS', label: 'Church Database', icon: IoIdCardOutline });

  // Tasks - available to all (filtered by role in backend)
  navItems.push({ id: 'TASKS', label: 'My Tasks', icon: IoCheckboxOutline });

  // Serve Team - only for admins and team leaders
  if (can(Permission.ANALYTICS_VIEW)) {
    navItems.push({ id: 'SERVE_TEAM', label: 'Serve Team', icon: IoHeartOutline });
  }

  // Academy - available to all authenticated users
  if (can(Permission.ACADEMY_VIEW)) {
    navItems.push({ id: 'ACADEMY', label: 'Academy', icon: IoSchoolOutline });
  }

  const handleLogout = () => {
      if(window.confirm('Are you sure you want to sign out?')) {
          signOut();
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
                {/* Changed truncate to whitespace-normal/break-words to show full name */}
                <h1 className="text-xl font-bold tracking-tight leading-tight mb-2 w-full break-words">{churchName}</h1>
                <div className="flex items-center gap-2 opacity-60">
                    <IoGitNetworkOutline size={14} className="text-success" />
                    <p className="text-[10px] uppercase tracking-wider font-semibold">Shepherd</p>
                </div>
              </div>
          ) : (
             <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-lg text-white border border-white/10" title={churchName}>
                 <IoGitNetworkOutline size={20} />
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

          {/* Super Admin Section */}
          {isSuperAdmin() && (
              <>
                 {!isCollapsed && <p className="px-4 pt-4 pb-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">System</p>}
                 <button
                    onClick={() => {
                      onViewChange('SUPER_ADMIN');
                      if (window.innerWidth < 768) toggleSidebar();
                    }}
                    className={`
                      w-full flex items-center ${isCollapsed ? 'justify-center px-0 mt-4' : 'space-x-3 px-4'} py-3 rounded-lg transition-all duration-200
                      ${currentView === 'SUPER_ADMIN' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30' : 'text-purple-200 hover:bg-purple-600/50 hover:text-white'}
                    `}
                    title={isCollapsed ? 'Super Admin' : ''}
                  >
                    <IoShieldCheckmarkOutline size={22} />
                    {!isCollapsed && <span className="font-medium animate-fade-in">Super Admin</span>}
                  </button>
              </>
          )}

          {/* Management Section - Forms & Integrations */}
          {(can(Permission.FORM_VIEW) || isAdmin() || isSuperAdmin()) && (
              <>
                 {!isCollapsed && <p className="px-4 pt-4 pb-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Management</p>}

                 {can(Permission.FORM_VIEW) && (
                   <button
                      onClick={() => {
                        onViewChange('FORMS');
                        if (window.innerWidth < 768) toggleSidebar();
                      }}
                      className={`
                        w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'space-x-3 px-4'} py-3 rounded-lg transition-all duration-200
                        ${currentView === 'FORMS' ? 'bg-primary text-white shadow-lg shadow-black/20' : 'text-secondary hover:bg-primary/50 hover:text-white'}
                      `}
                      title={isCollapsed ? 'Forms' : ''}
                    >
                      <IoDocumentTextOutline size={22} />
                      {!isCollapsed && <span className="font-medium animate-fade-in">Forms</span>}
                    </button>
                 )}

                 {(isAdmin() || isSuperAdmin()) && (
                   <button
                      onClick={() => {
                        onViewChange('INTEGRATIONS');
                        if (window.innerWidth < 768) toggleSidebar();
                      }}
                      className={`
                        w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'space-x-3 px-4'} py-3 rounded-lg transition-all duration-200
                        ${currentView === 'INTEGRATIONS' ? 'bg-primary text-white shadow-lg shadow-black/20' : 'text-secondary hover:bg-primary/50 hover:text-white'}
                      `}
                      title={isCollapsed ? 'Integrations' : ''}
                    >
                      <IoServerOutline size={22} />
                      {!isCollapsed && <span className="font-medium animate-fade-in">Integrations</span>}
                    </button>
                 )}
              </>
          )}

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
            {currentUser && (
              <>
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs border-2 border-ocean shrink-0">
                  {currentUser.firstName?.charAt(0) || currentUser.name?.charAt(0)}
                </div>
                {!isCollapsed && (
                    <div className="truncate animate-fade-in">
                      <p className="text-sm font-semibold text-white truncate">{currentUser.firstName && currentUser.lastName ? `${currentUser.firstName} ${currentUser.lastName}` : currentUser.name}</p>
                      <div className="flex items-center gap-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          isSuperAdmin() ? 'bg-purple-600/20 text-purple-200' :
                          isAdmin() ? 'bg-blue-600/20 text-blue-200' :
                          isTeamLeader() ? 'bg-green-600/20 text-green-200' :
                          'bg-gray-600/20 text-gray-300'
                        }`}>
                          {isSuperAdmin() ? 'Super Admin' : isAdmin() ? 'Admin' : isTeamLeader() ? 'Team Leader' : 'Volunteer'}
                        </span>
                      </div>
                    </div>
                )}
              </>
            )}
          </button>


          {/* Settings - only show if user can update settings */}
          {can(Permission.SETTINGS_UPDATE) && (
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
          )}
          
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
