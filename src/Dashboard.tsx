import React, { useState } from 'react';
import { HistoricalCharts, ServiceMap, SLODashboard, AIPanel, type Insight } from './components';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import './Dashboard.css';

const DashboardContent: React.FC = () => {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [activeTab, setActiveTab] = useState('overview');
  const { theme, toggleTheme } = useTheme();

  const handleInvestigate = (insight: Insight) => {
    console.log('Investigating:', insight);
  };

  const handleDismiss = (insight: Insight) => {
    console.log('Dismissing:', insight);
  };

  const handleGenerateReport = () => {
    console.log('Generating daily report...');
  };

  const handleRefresh = () => {
    console.log('Refreshing dashboard...');
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>🦅 Observability Dashboard</h1>
          <span className="environment-badge">Production</span>
        </div>
        <div className="header-right">
          <span className="last-update">Dernière mise à jour: il y a 2 min</span>
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === 'light' ? '🌙' : '☀️'} {theme === 'light' ? 'Dark' : 'Light'}
          </button>
          <button className="refresh-btn" onClick={handleRefresh}>
            🔄 Rafraîchir
          </button>
        </div>
      </header>

      <nav className="dashboard-nav">
        {[
          { id: 'overview', label: "Vue d'ensemble" },
          { id: 'metrics', label: 'Métriques' },
          { id: 'logs', label: 'Logs' },
          { id: 'traces', label: 'Traces' },
          { id: 'alerts', label: 'Alertes' },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`nav-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="dashboard-grid">
        <div className="grid-row">
          <div className="grid-col-8">
            <HistoricalCharts 
              period={period} 
              onPeriodChange={setPeriod} 
            />
          </div>
          <div className="grid-col-4">
            <SLODashboard period={`Dernier ${period === '7d' ? '7' : period === '30d' ? '30' : '90'} jours`} />
          </div>
        </div>
        
        <div className="grid-row">
          <div className="grid-col-6">
            <ServiceMap />
          </div>
          <div className="grid-col-6">
            <AIPanel 
              onInvestigate={handleInvestigate}
              onDismiss={handleDismiss}
              onGenerateReport={handleGenerateReport}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

const Dashboard: React.FC = () => {
  return (
    <ThemeProvider>
      <DashboardContent />
    </ThemeProvider>
  );
};

export default Dashboard;
