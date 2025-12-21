
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
import { ViewState } from './types';

// The Inner App handles routing state based on AuthStage
const InnerApp: React.FC = () => {
  const { authStage } = useAppContext();
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
      default: return <Dashboard />;
    }
  };

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
  return (
    <ErrorBoundary>
      <AppProvider>
        <InnerApp />
      </AppProvider>
    </ErrorBoundary>
  );
};

export default App;
