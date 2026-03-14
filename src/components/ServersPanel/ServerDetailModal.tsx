import React, { useState, useEffect } from 'react';
import './ServerDetailModal.css';

interface ServerMetric {
  timestamp: string;
  cpu: number;
  memory: number;
  disk: number;
  cpuTemp?: number;
  networkIn?: number;
  networkOut?: number;
}

interface Server {
  id: string;
  name: string;
  ip: string;
  type: string;
  status: 'online' | 'offline' | 'warning';
  cpu?: number;
  memory?: number;
  disk?: number;
  ramTotalGb?: number;
  diskTotalGb?: number;
  cpuModel?: string;
  lastSeen?: string;
}

interface ServerDetailModalProps {
  server: Server;
  onClose: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.100.30:3002';

export const ServerDetailModal: React.FC<ServerDetailModalProps> = ({ server, onClose }) => {
  const [metrics, setMetrics] = useState<ServerMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d'>('1h');

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const hours = timeRange === '1h' ? 1 : timeRange === '24h' ? 24 : 168;
        const response = await fetch(`${API_URL}/api/servers/${server.id}/metrics?hours=${hours}`);
        const data = await response.json();
        setMetrics(data);
      } catch (err) {
        console.error('Failed to fetch metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    if (server.id) {
      fetchMetrics();
      const interval = setInterval(fetchMetrics, timeRange === '1h' ? 60000 : 300000); // 1min or 5min
      return () => clearInterval(interval);
    }
  }, [server.id, timeRange]);

  const formatBytes = (gb: number): string => {
    if (gb >= 1000) return `${(gb / 1000).toFixed(1)} TB`;
    return `${gb} GB`;
  };

  const getMetricColor = (value: number, threshold: number = 80): string => {
    if (value >= 90) return '#dc2626';
    if (value >= threshold) return '#f59e0b';
    return '#10b981';
  };

  // Calcul des statistiques
  const avgCpu = metrics.length > 0 ? metrics.reduce((sum, m) => sum + m.cpu, 0) / metrics.length : 0;
  const avgMemory = metrics.length > 0 ? metrics.reduce((sum, m) => sum + m.memory, 0) / metrics.length : 0;
  const avgDisk = metrics.length > 0 ? metrics.reduce((sum, m) => sum + m.disk, 0) / metrics.length : 0;
  const maxCpu = metrics.length > 0 ? Math.max(...metrics.map(m => m.cpu)) : 0;
  const maxMemory = metrics.length > 0 ? Math.max(...metrics.map(m => m.memory)) : 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="server-title">
            <h2>🖥️ {server.name}</h2>
            <span className={`status-badge ${server.status}`}>
              {server.status.toUpperCase()}
            </span>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Server Info */}
          <div className="server-info-section">
            <h3>Informations Serveur</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Adresse IP:</span>
                <span className="info-value">{server.ip}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Type:</span>
                <span className="info-value">{server.type}</span>
              </div>
              {server.cpuModel && (
                <div className="info-item">
                  <span className="info-label">CPU:</span>
                  <span className="info-value">{server.cpuModel}</span>
                </div>
              )}
              {server.ramTotalGb && (
                <div className="info-item">
                  <span className="info-label">RAM Totale:</span>
                  <span className="info-value">{server.ramTotalGb} GB</span>
                </div>
              )}
              {server.diskTotalGb && (
                <div className="info-item">
                  <span className="info-label">Disque Total:</span>
                  <span className="info-value">{formatBytes(server.diskTotalGb)}</span>
                </div>
              )}
              {server.lastSeen && (
                <div className="info-item">
                  <span className="info-label">Dernière connexion:</span>
                  <span className="info-value">{new Date(server.lastSeen).toLocaleString('fr-FR')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Current Metrics */}
          {server.status === 'online' && (
            <div className="current-metrics-section">
              <h3>Métriques en Temps Réel</h3>
              <div className="metrics-cards">
                <div className="metric-card">
                  <div className="metric-card-header">
                    <span className="metric-card-icon">⚙️</span>
                    <span className="metric-card-label">CPU</span>
                  </div>
                  <div className="metric-card-value" style={{ color: getMetricColor(server.cpu || 0) }}>
                    {server.cpu !== undefined ? `${server.cpu}%` : 'N/A'}
                  </div>
                  <div className="metric-card-details">
                    <span>Moy: {avgCpu.toFixed(1)}%</span>
                    <span>Max: {maxCpu}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${server.cpu || 0}%`, backgroundColor: getMetricColor(server.cpu || 0) }}
                    />
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-card-header">
                    <span className="metric-card-icon">🧠</span>
                    <span className="metric-card-label">RAM</span>
                  </div>
                  <div className="metric-card-value" style={{ color: getMetricColor(server.memory || 0) }}>
                    {server.memory !== undefined ? `${server.memory}%` : 'N/A'}
                    {server.ramTotalGb && (
                      <span className="metric-card-sub">
                        / {((server.memory || 0) * server.ramTotalGb / 100).toFixed(1)} GB
                      </span>
                    )}
                  </div>
                  <div className="metric-card-details">
                    <span>Moy: {avgMemory.toFixed(1)}%</span>
                    <span>Max: {maxMemory}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${server.memory || 0}%`, backgroundColor: getMetricColor(server.memory || 0) }}
                    />
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-card-header">
                    <span className="metric-card-icon">💾</span>
                    <span className="metric-card-label">Disque</span>
                  </div>
                  <div className="metric-card-value" style={{ color: getMetricColor(server.disk || 0) }}>
                    {server.disk !== undefined ? `${server.disk}%` : 'N/A'}
                    {server.diskTotalGb && (
                      <span className="metric-card-sub">
                        / {formatBytes(server.diskTotalGb * (server.disk || 0) / 100)}
                      </span>
                    )}
                  </div>
                  <div className="metric-card-details">
                    <span>Moy: {avgDisk.toFixed(1)}%</span>
                    <span>Max: {server.disk}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${server.disk || 0}%`, backgroundColor: getMetricColor(server.disk || 0) }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Historical Charts */}
          {server.status === 'online' && (
            <div className="historical-section">
              <div className="chart-header">
                <h3>Historique des Métriques</h3>
                <div className="time-range-selector">
                  <button 
                    className={timeRange === '1h' ? 'active' : ''}
                    onClick={() => setTimeRange('1h')}
                  >
                    1H
                  </button>
                  <button 
                    className={timeRange === '24h' ? 'active' : ''}
                    onClick={() => setTimeRange('24h')}
                  >
                    24H
                  </button>
                  <button 
                    className={timeRange === '7d' ? 'active' : ''}
                    onClick={() => setTimeRange('7d')}
                  >
                    7J
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="chart-loading">Chargement des données...</div>
              ) : metrics.length === 0 ? (
                <div className="chart-no-data">Aucune donnée historique disponible</div>
              ) : (
                <div className="charts-container">
                  {/* CPU Chart */}
                  <div className="chart-wrapper">
                    <h4>Utilisation CPU (%)</h4>
                    <div className="simple-chart">
                      <svg viewBox="0 0 400 100" className="chart-svg">
                        <defs>
                          <linearGradient id="cpuGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 0.8 }} />
                            <stop offset="100%" style={{ stopColor: '#10b981', stopOpacity: 0.1 }} />
                          </linearGradient>
                        </defs>
                        <path
                          d={createAreaPath(metrics.map(m => m.cpu), 400, 100)}
                          fill="url(#cpuGradient)"
                          stroke="#10b981"
                          strokeWidth="2"
                        />
                      </svg>
                      <div className="chart-axis">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>

                  {/* RAM Chart */}
                  <div className="chart-wrapper">
                    <h4>Utilisation RAM (%)</h4>
                    <div className="simple-chart">
                      <svg viewBox="0 0 400 100" className="chart-svg">
                        <defs>
                          <linearGradient id="ramGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 0.8 }} />
                            <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 0.1 }} />
                          </linearGradient>
                        </defs>
                        <path
                          d={createAreaPath(metrics.map(m => m.memory), 400, 100)}
                          fill="url(#ramGradient)"
                          stroke="#3b82f6"
                          strokeWidth="2"
                        />
                      </svg>
                      <div className="chart-axis">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>

                  {/* Disk Chart */}
                  <div className="chart-wrapper">
                    <h4>Utilisation Disque (%)</h4>
                    <div className="simple-chart">
                      <svg viewBox="0 0 400 100" className="chart-svg">
                        <defs>
                          <linearGradient id="diskGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style={{ stopColor: '#f59e0b', stopOpacity: 0.8 }} />
                            <stop offset="100%" style={{ stopColor: '#f59e0b', stopOpacity: 0.1 }} />
                          </linearGradient>
                        </defs>
                        <path
                          d={createAreaPath(metrics.map(m => m.disk), 400, 100)}
                          fill="url(#diskGradient)"
                          stroke="#f59e0b"
                          strokeWidth="2"
                        />
                      </svg>
                      <div className="chart-axis">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function to create SVG area path
function createAreaPath(data: number[], width: number, height: number): string {
  if (data.length === 0) return '';
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - (value / 100) * height;
    return `${x},${y}`;
  });

  const pathStart = points[0] || `0,${height}`;
  
  return `M ${pathStart} L ${points.join(' L ')} L ${width},${height} L 0,${height} Z`;
}
