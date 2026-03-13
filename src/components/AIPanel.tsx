import React from 'react';
import './AIPanel.css';

export type InsightType = 'anomaly' | 'prediction' | 'recommendation';
export type InsightSeverity = 'info' | 'warning' | 'critical';

export interface Insight {
  id: string;
  type: InsightType;
  severity: InsightSeverity;
  title: string;
  description: string;
  timestamp: string;
}

interface AIPanelProps {
  insights?: Insight[];
  onInvestigate?: (insight: Insight) => void;
  onDismiss?: (insight: Insight) => void;
  onGenerateReport?: () => void;
}

const defaultInsights: Insight[] = [
  {
    id: '1',
    type: 'prediction',
    severity: 'warning',
    title: 'Disk space will reach 90% in 5 days',
    description: 'Based on current growth rate (2%/day), storage will be critical by March 18.',
    timestamp: '2 min ago'
  },
  {
    id: '2',
    type: 'anomaly',
    severity: 'info',
    title: 'Unusual traffic spike detected',
    description: 'API requests increased 340% in the last hour. Pattern suggests legitimate batch job.',
    timestamp: '15 min ago'
  },
  {
    id: '3',
    type: 'recommendation',
    severity: 'info',
    title: 'Consider scaling User Service',
    description: 'CPU usage trending upward. Auto-scaling recommended for peak hours.',
    timestamp: '1 hour ago'
  }
];

const getTypeIcon = (type: InsightType): string => {
  switch (type) {
    case 'anomaly': return '🔍';
    case 'prediction': return '🔮';
    case 'recommendation': return '💡';
    default: return '📌';
  }
};

const getSeverityColor = (severity: InsightSeverity): string => {
  switch (severity) {
    case 'critical': return '#dc2626';
    case 'warning': return '#f59e0b';
    case 'info': return '#3b82f6';
    default: return '#6b7280';
  }
};

export const AIPanel: React.FC<AIPanelProps> = ({ 
  insights = defaultInsights,
  onInvestigate,
  onDismiss,
  onGenerateReport
}) => {
  return (
    <div className="widget ai-panel">
      <div className="widget-header">
        <h3>🤖 Insights IA</h3>
        <span className="ai-badge">{insights.length} nouveaux</span>
      </div>
      
      <div className="insights-list">
        {insights.map(insight => (
          <div 
            key={insight.id} 
            className="insight-card"
            style={{ borderLeftColor: getSeverityColor(insight.severity) }}
          >
            <div className="insight-header">
              <span className="insight-icon">{getTypeIcon(insight.type)}</span>
              <span className="insight-type">{insight.type}</span>
              <span className="insight-time">{insight.timestamp}</span>
            </div>
            <h4 className="insight-title">{insight.title}</h4>
            <p className="insight-description">{insight.description}</p>
            <div className="insight-actions">
              <button 
                className="action-btn primary"
                onClick={() => onInvestigate?.(insight)}
              >
                Investiguer
              </button>
              <button 
                className="action-btn"
                onClick={() => onDismiss?.(insight)}
              >
                Ignorer
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="ai-footer">
        <button className="generate-btn" onClick={onGenerateReport}>
          ✨ Générer un rapport quotidien
        </button>
      </div>
    </div>
  );
};
