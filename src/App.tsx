import React from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { RealtimeProvider } from './context/RealtimeContext';
import Dashboard from './Dashboard/Dashboard';
import './Dashboard/Dashboard.css';

const AppContent: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div className={`app ${theme}`}>
      <Dashboard />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <RealtimeProvider>
        <AppContent />
      </RealtimeProvider>
    </ThemeProvider>
  );
};

export default App;
