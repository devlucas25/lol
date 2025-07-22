import React from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import { LoginForm } from './components/Auth/LoginForm';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { ResearcherApp } from './components/Researcher/ResearcherApp';

function AppContent() {
  const { currentUser } = useApp();

  if (!currentUser) {
    return <LoginForm />;
  }

  if (currentUser.role === 'admin') {
    return <AdminDashboard />;
  }

  return <ResearcherApp />;
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;