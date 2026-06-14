
import React from 'react';
import { IoGridOutline, IoPeopleOutline, IoCheckboxOutline, IoSettingsOutline, IoLogOutOutline, IoChevronBackOutline, IoChevronForwardOutline, IoGitNetworkOutline, IoIdCardOutline, IoShieldCheckmarkOutline, IoHandLeftOutline, IoServerOutline, IoDocumentTextOutline, IoSchoolOutline, IoPerson, IoPeopleCircleOutline } from 'react-icons/io5';
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
  const { can, isSuperAdmin, isAdmin, userRole } = usePermissions();

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

  // Serve Team - visible to anyone with SERVE_TEAM_VIEW permission
  if (can(Permission.SERVE_TEAM_VIEW)) {
    navItems.push({ id: 'SERVE_TEAM', label: 'Serve Team', icon: IoHandLeftOutline });
  }

  // Groups - visible to anyone with SERVE_TEAM_VIEW permission
  if (can(Permission.SERVE_TEAM_VIEW)) {
    navItems.push({ id: 'GROUPS', label: 'Groups', icon: IoPeopleCircleOutline });
  }

  // Users - visible to anyone with USER_VIEW permission
  if (can(Permission.USER_VIEW)) {
    navItems.push({ id: 'USERS', label: 'Users', icon: IoPerson });
  }

  // Academy - available to all authenticated users
  if (can(Permission.ACADEMY_VIEW)) {
    navItems.push({ id: 'ACADEMY', label: 'Academy', icon: IoSchoolOutline });
  }

  const handleLogout = () => {
    signOut();
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
        fixed top-0 left-0 z-30 h-screen bg-[#F5F1E8] transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
        ${isCollapsed ? 'w-20' : 'w-60'}
        flex flex-col
      `}>
        {/* Collapse Toggle (Desktop Only) */}
        <button
            onClick={toggleCollapse}
            className="hidden md:flex absolute -right-3 top-8 bg-[#14213D] text-white p-1 rounded-full border border-[#D8D2C2] shadow-md z-50 hover:bg-[#1F2D52] transition-colors"
        >
            {isCollapsed ? <IoChevronForwardOutline size={14} /> : <IoChevronBackOutline size={14} />}
        </button>

        {/* Church Name / Logo */}
        <div className={`px-4 pt-5 pb-4 border-b border-[#E5E0D2] min-h-[80px] flex flex-col justify-center ${isCollapsed ? 'items-center px-2' : ''}`}>
          {!isCollapsed ? (
              <div className="animate-fade-in">
                <h1 className="text-base font-semibold text-[#14213D] leading-tight mb-1 break-words">{churchName}</h1>
                <div className="flex items-center gap-1.5">
                    <IoGitNetworkOutline size={12} className="text-[#FCA311]" />
                    <p className="text-[10px] uppercase tracking-[0.08em] font-semibold text-[#6B6960]">Shepherd</p>
                </div>
              </div>
          ) : (
             <div className="w-9 h-9 rounded-lg bg-[#14213D] flex items-center justify-center text-white border border-[#E5E0D2]" title={churchName}>
                 <IoGitNetworkOutline size={18} />
             </div>
          )}
        </div>

        {/* Main Nav */}
        <nav className="flex-1 px-2 py-4 overflow-y-auto scrollbar-thin">

          {/* Main section overline */}
          {!isCollapsed && (
            <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960]">Main</p>
          )}

          <div className="space-y-0.5">
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
                    w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2 rounded-md transition-colors duration-150 text-sm font-medium
                    ${isActive
                      ? 'nav-active relative text-[#14213D]'
                      : 'text-[#1F2D52] hover:bg-black/[0.04]'
                    }
                  `}
                  title={isCollapsed ? item.label : ''}
                >
                  <Icon size={20} className={isActive ? 'text-[#14213D]' : 'text-[#6B6960]'} />
                  {!isCollapsed && <span className="animate-fade-in">{item.label}</span>}
                </button>
              );
            })}
          </div>

          {/* Super Admin Section */}
          {isSuperAdmin() && (
              <div className="mt-5">
                {!isCollapsed && (
                  <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960]">System</p>
                )}
                <button
                  onClick={() => {
                    onViewChange('SUPER_ADMIN');
                    if (window.innerWidth < 768) toggleSidebar();
                  }}
                  className={`
                    w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2 rounded-md transition-colors duration-150 text-sm font-medium
                    ${currentView === 'SUPER_ADMIN'
                      ? 'nav-active relative text-[#14213D]'
                      : 'text-[#1F2D52] hover:bg-black/[0.04]'
                    }
                  `}
                  title={isCollapsed ? 'Super Admin' : ''}
                >
                  <IoShieldCheckmarkOutline size={20} className={currentView === 'SUPER_ADMIN' ? 'text-[#14213D]' : 'text-[#6B6960]'} />
                  {!isCollapsed && <span className="animate-fade-in">Super Admin</span>}
                </button>
              </div>
          )}

          {/* Management Section - Forms & Integrations */}
          {(can(Permission.FORM_VIEW) || isAdmin() || isSuperAdmin()) && (
              <div className="mt-5">
                {!isCollapsed && (
                  <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960]">Management</p>
                )}

                <div className="space-y-0.5">
                  {can(Permission.FORM_VIEW) && (
                    <button
                      onClick={() => {
                        onViewChange('FORMS');
                        if (window.innerWidth < 768) toggleSidebar();
                      }}
                      className={`
                        w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2 rounded-md transition-colors duration-150 text-sm font-medium
                        ${currentView === 'FORMS'
                          ? 'nav-active relative text-[#14213D]'
                          : 'text-[#1F2D52] hover:bg-black/[0.04]'
                        }
                      `}
                      title={isCollapsed ? 'Forms' : ''}
                    >
                      <IoDocumentTextOutline size={20} className={currentView === 'FORMS' ? 'text-[#14213D]' : 'text-[#6B6960]'} />
                      {!isCollapsed && <span className="animate-fade-in">Forms</span>}
                    </button>
                  )}

                  {(isAdmin() || isSuperAdmin()) && (
                    <button
                      onClick={() => {
                        onViewChange('INTEGRATIONS');
                        if (window.innerWidth < 768) toggleSidebar();
                      }}
                      className={`
                        w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2 rounded-md transition-colors duration-150 text-sm font-medium
                        ${currentView === 'INTEGRATIONS'
                          ? 'nav-active relative text-[#14213D]'
                          : 'text-[#1F2D52] hover:bg-black/[0.04]'
                        }
                      `}
                      title={isCollapsed ? 'Integrations' : ''}
                    >
                      <IoServerOutline size={20} className={currentView === 'INTEGRATIONS' ? 'text-[#14213D]' : 'text-[#6B6960]'} />
                      {!isCollapsed && <span className="animate-fade-in">Integrations</span>}
                    </button>
                  )}
                </div>
              </div>
          )}

        </nav>

        {/* Bottom: Profile chip + Settings + Sign Out */}
        <div className="px-3 py-3 border-t border-[#E5E0D2] space-y-1">
          {/* Profile chip */}
          {currentUser && (
            <button
               onClick={() => {
                 onViewChange('PROFILE');
                 if (window.innerWidth < 768) toggleSidebar();
               }}
               className={`bg-white border border-[#E5E0D2] rounded-md p-3 flex items-center gap-3 w-full text-left transition-colors duration-150
                 ${currentView === 'PROFILE' ? 'nav-active relative' : 'hover:bg-black/[0.04]'}`}
               title={isCollapsed ? 'My Profile' : ''}
            >
              <div className="w-8 h-8 rounded-full bg-[#EFEBE0] text-[#6B6960] flex items-center justify-center font-semibold text-xs shrink-0">
                {currentUser.firstName?.charAt(0) || currentUser.name?.charAt(0)}
              </div>
              {!isCollapsed && (
                  <div className="truncate animate-fade-in min-w-0">
                    <p className="text-sm font-semibold text-[#14213D] truncate leading-tight">
                      {currentUser.firstName && currentUser.lastName
                        ? `${currentUser.firstName} ${currentUser.lastName}`
                        : currentUser.name}
                    </p>
                    <p className="text-[10px] text-[#6B6960] font-medium leading-tight mt-0.5">
                      {isSuperAdmin() ? 'Super Admin' : isAdmin() ? 'Church Admin' : userRole === 'PASTOR' ? 'Pastor' : userRole === 'MINISTRY_LEADER' ? 'Ministry Leader' : 'Volunteer'}
                    </p>
                  </div>
              )}
            </button>
          )}

          {/* Settings */}
          {can(Permission.SETTINGS_UPDATE) && (
            <button
               onClick={() => {
                 onViewChange('SETTINGS');
                 if (window.innerWidth < 768) toggleSidebar();
               }}
               className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2 text-sm text-[#6B6960] hover:text-[#14213D] hover:bg-black/[0.04] transition-colors duration-150 w-full rounded-md font-medium
                 ${currentView === 'SETTINGS' ? 'text-[#14213D] nav-active relative' : ''}`}
               title={isCollapsed ? 'Settings' : ''}
            >
              <IoSettingsOutline size={20} />
              {!isCollapsed && <span className="animate-fade-in">Settings</span>}
            </button>
          )}

          <button
            onClick={handleLogout}
            className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2 text-sm text-[#6B6960] hover:text-[#B42626] hover:bg-black/[0.04] transition-colors duration-150 w-full rounded-md font-medium`}
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
