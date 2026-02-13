import React, { useState } from 'react';
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
import { ViewState } from './types';

// The Inner App handles routing state based on AuthStage
const InnerApp: React.FC = () => {
  const { authStage, isLoading } = useAppContext();
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');

  const renderContent = () => {
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
    <Layout currentView={currentView} onViewChange={setCurrentView}>
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
      <ErrorBoundary>
        <InnerApp />
      </ErrorBoundary>
    </AppProvider>
  );
};

export default App;
