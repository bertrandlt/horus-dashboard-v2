import React from 'react';
import './SLODashboard.css';

interface SLO {
  name: string;
  target: number;
  current: number;
  unit: string;
  status: 'met' | 'at-risk' | 'breached';
}

const defaultSlos: SLO[] = [
  { name: 'Availability', target: 99.9, current: 99.95, unit: '%', status: 'met' },
  { name: 'Latency (p99)', target: 200, current: 180, unit: 'ms', status: 'met' },
  { name: 'Error Rate', target: 0.1, current: 0.15, unit: '%', status: 'at-risk' },
  { name: 'Throughput', target: 1000, current: 850, unit: 'req/s', status: 'at-risk' },
];

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'met': return '#10b981';
    case 'at-risk': return '#f59e0b';
    case 'breached': return '#dc2626';
    default: return '#6b7280';
  }
};

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'met': return '✓ OK';
    case 'at-risk': return '⚠ At Risk';
    case 'breached': return '✗ Breached';
    default: return '?';
  }
};

interface SLODashboardProps {
  slos?: SLO[];
  period?: string;
}

export const SLODashboard: React.FC<SLODashboardProps> = ({ 
  slos = defaultSlos,
  period = 'Dernier 30 jours'
}) => {
  const metCount = slos.filter((s) => s.status === 'met').length;
  const atRiskCount = slos.filter((s) => s.status === 'at-risk').length;
  const breachedCount = slos.filter((s) => s.status === 'breached').length;

  return (
    <div className="widget slo-dashboard">
      <div className="widget-header">
        <h3>🎯 SLO / SLI Dashboard</h3>
        <span className="slo-period">{period}</span>
      </div>
      
      <div className="slo-grid">
        {slos.map((slo, index) => {
          const color = getStatusColor(slo.status);
          const progress = Math.min((slo.current / slo.target) * 100, 100);
          
          return (
            <div key={index} className={`slo-card ${slo.status}`}>
              <div className="slo-header">
                <span className="slo-name">{slo.name}</span>
                <span className="slo-status" style={{ color }}>
                  {getStatusLabel(slo.status)}
                </span>
              </div>
              
              <div className="slo-metrics">
                <div className="slo-current">
                  <span className="value">{slo.current}</span>
                  <span className="unit">{slo.unit}</span>
                </div>
                <div className="slo-target">
                  Target: {slo.target}{slo.unit}
                </div>
              </div>
              
              <div className="slo-progress">
                <div 
                  className="progress-bar"
                  style={{ 
                    width: `${progress}%`,
                    backgroundColor: color
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="slo-summary">
        <div className="summary-item">
          <span className="summary-value met">{metCount}/{slos.length}</span>
          <span className="summary-label">SLOs OK</span>
        </div>
        <div className="summary-item">
          <span className="summary-value at-risk">{atRiskCount}/{slos.length}</span>
          <span className="summary-label">At Risk</span>
        </div>
        <div className="summary-item">
          <span className="summary-value breached">{breachedCount}/{slos.length}</span>
          <span className="summary-label">Breached</span>
        </div>
      </div>
    </div>
  );
};
