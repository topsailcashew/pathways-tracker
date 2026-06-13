import React, { useState, useEffect, useCallback } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import PeopleList from './components/PeopleList';
import MembersPage from './components/MembersPage';
import PathwaysPage from './components/PathwaysPage';
import TaskList from './components/TaskList';
import ProfilePage from './components/ProfilePage';
import SettingsPage from './components/SettingsPage';
import AuthPage from './components/AuthPage';
import OnboardingPage from './components/OnboardingPage';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import FormsPage from './components/FormsPage';
import PublicFormPage from './components/PublicFormPage';
import IntegrationsPage from './components/IntegrationsPage';
import ServeTeamPage from './components/ServeTeamPage';
import AcademyPage from './components/AcademyPage';
import UsersPage from './components/UsersPage';
import GroupsPage from './components/GroupsPage';
import { ToastProvider } from './src/components/Toast';
import { ViewState } from './types';
import { usePermissions } from './src/hooks/usePermissions';
import { Permission } from './src/utils/permissions';

const PATH_TO_VIEW: Record<string, ViewState> = {
  '/':             'DASHBOARD',
  '/pathways':     'PATHWAYS',
  '/members':      'MEMBERS',
  '/people':       'PEOPLE',
  '/tasks':        'TASKS',
  '/settings':     'SETTINGS',
  '/forms':        'FORMS',
  '/integrations': 'INTEGRATIONS',
  '/serve-team':   'SERVE_TEAM',
  '/academy':      'ACADEMY',
  '/users':        'USERS',
  '/groups':       'GROUPS',
  '/profile':      'PROFILE',
  '/admin':        'SUPER_ADMIN',
};

const VIEW_TO_PATH: Record<ViewState, string> = Object.fromEntries(
  Object.entries(PATH_TO_VIEW).map(([path, view]) => [view, path])
) as Record<ViewState, string>;

function viewFromPath(pathname: string): ViewState {
  return PATH_TO_VIEW[pathname] ?? 'DASHBOARD';
}

// Maps each protected view to the permission required to access it
const VIEW_PERMISSIONS: Partial<Record<ViewState, Permission>> = {
  SETTINGS:    Permission.SETTINGS_UPDATE,
  INTEGRATIONS: Permission.INTEGRATION_VIEW,
  FORMS:       Permission.FORM_VIEW,
  USERS:       Permission.USER_VIEW,
  SUPER_ADMIN: Permission.ADMIN_MANAGE_TENANTS,
};

// The Inner App handles routing state based on AuthStage
const InnerApp: React.FC = () => {
  const { authStage, isLoading } = useAppContext();
  const { can } = usePermissions();
  const [currentView, setCurrentView] = useState<ViewState>(() => viewFromPath(window.location.pathname));

  const navigateTo = useCallback((view: ViewState) => {
    const path = VIEW_TO_PATH[view] ?? '/';
    if (window.location.pathname !== path) {
      window.history.pushState({ view }, '', path);
    }
    setCurrentView(view);
  }, []);

  useEffect(() => {
    const onPopState = (_e: PopStateEvent) => {
      setCurrentView(viewFromPath(window.location.pathname));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const renderContent = () => {
    // Guard: if this view requires a permission the user doesn't have, redirect to dashboard
    const requiredPermission = VIEW_PERMISSIONS[currentView];
    if (requiredPermission && !can(requiredPermission)) {
      // Redirect in next tick to avoid state update during render
      setTimeout(() => navigateTo('DASHBOARD'), 0);
      return <Dashboard />;
    }

    switch (currentView) {
      case 'DASHBOARD': return <Dashboard />;
      case 'PEOPLE': return <PeopleList />;
      case 'MEMBERS': return <MembersPage />;
      case 'PATHWAYS': return <PathwaysPage />;
      case 'TASKS': return <TaskList />;
      case 'PROFILE': return <ProfilePage />;
      case 'SETTINGS': return <SettingsPage />;
      case 'SUPER_ADMIN': return <SuperAdminDashboard />;
      case 'FORMS': return <FormsPage />;
      case 'INTEGRATIONS': return <IntegrationsPage />;
      case 'SERVE_TEAM': return <ServeTeamPage />;
      case 'ACADEMY': return <AcademyPage />;
      case 'USERS': return <UsersPage />;
      case 'GROUPS': return <GroupsPage />;
      default: return <Dashboard />;
    }
  };

  // Show loading spinner while restoring session
  if (isLoading && authStage === 'AUTH') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (authStage === 'AUTH') {
      return <AuthPage />;
  }

  if (authStage === 'ONBOARDING') {
      return <OnboardingPage />;
  }

  return (
    <Layout currentView={currentView} onViewChange={navigateTo}>
        {renderContent()}
    </Layout>
  );
};

const App: React.FC = () => {
  // Handle public form routes before rendering the authenticated app
  const path = window.location.pathname;
  if (path.startsWith('/form/')) {
    const slug = path.replace('/form/', '');
    if (slug) {
      return (
        <ErrorBoundary>
          <PublicFormPage slug={slug} />
        </ErrorBoundary>
      );
    }
  }

  return (
    <AppProvider>
      <ToastProvider>
        <ErrorBoundary>
          <InnerApp />
        </ErrorBoundary>
      </ToastProvider>
    </AppProvider>
  );
};

export default App;
