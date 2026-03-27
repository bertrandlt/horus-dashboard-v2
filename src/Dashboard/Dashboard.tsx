import React, { useState } from 'react';
import { ServiceMap, SLODashboard, AIPanel, ServersPanel, type Insight } from '../components';
import { HistoricalCharts } from '../components/HistoricalCharts/HistoricalCharts';
import WebServicesMonitor from '../components/WebServicesMonitor';
import { useTheme } from '../context/ThemeContext';
import { useRealtime } from '../context/RealtimeContext';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [activeTab, setActiveTab] = useState('overview');
  const { theme, toggleTheme } = useTheme();
  const { isConnected, lastUpdate } = useRealtime();

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
    window.location.reload();
  };

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'web-services':
        return (
          <div className="grid-row">
            <div className="grid-col-12">
              <WebServicesMonitor />
            </div>
          </div>
        );
      
      case 'overview':
      default:
        return (
          <>
            <div className="grid-row">
              <div className="grid-col-12">
                <ServersPanel />
              </div>
            </div>
            
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
          </>
        );
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>🦅 Observability Dashboard</h1>
          <span className="environment-badge">Production</span>
        </div>
        <div className="header-right">
          <span className="last-update">
            {isConnected ? '🟢 Live' : '🔴 Déconnecté'} 
            {lastUpdate && ` • ${lastUpdate.toLocaleTimeString()}`}
          </span>
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button className="refresh-btn" onClick={handleRefresh}>
            🔄
          </button>
        </div>
      </header>

      <nav className="dashboard-nav">
        {[
          { id: 'overview', label: "Vue d'ensemble" },
          { id: 'web-services', label: 'Web Services' },
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
        {renderContent()}
      </main>
    </div>
  );
};

export default Dashboard;
