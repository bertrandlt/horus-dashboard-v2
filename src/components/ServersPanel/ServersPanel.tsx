import React, { useState, useEffect } from 'react';
import './ServersPanel.css';
import { ServerDetailModal } from './ServerDetailModal';

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

const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.100.30:8082';

export const ServersPanel: React.FC = () => {
  const [servers, setServers] = useState<Server[]>([]);
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const selectedServer = servers.find(s => s.id === selectedServerId) || null;

  useEffect(() => {
    const fetchServers = async () => {
      try {
        const response = await fetch(`${API_URL}/api/servers`);
        const data = await response.json();
        setServers(data); // Les données arrivent directement de l'agent !
      } catch (err) {
        console.error('Failed to fetch servers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchServers();
    const interval = setInterval(fetchServers, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const onlineCount = servers.filter(s => s.status === 'online').length;
  const offlineCount = servers.filter(s => s.status === 'offline').length;
  const warningCount = servers.filter(s => s.status === 'warning').length;

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'online': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'offline': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'online': return 'ONLINE';
      case 'warning': return 'WARNING';
      case 'offline': return 'OFFLINE';
      default: return 'UNKNOWN';
    }
  };

  if (loading) {
    return (
      <div className="widget servers-panel">
        <div className="widget-header">
          <h3>🖥️ Serveurs</h3>
        </div>
        <div className="loading">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="widget servers-panel">
      <div className="widget-header">
        <h3>🖥️ Serveurs</h3>
        <div className="servers-summary">
          <span className="badge online">{onlineCount} online</span>
          <span className="badge offline">{offlineCount} offline</span>
        </div>
      </div>

      <div className="servers-grid">
        {servers.map(server => (
          <div 
            key={server.id} 
            className={`server-card ${server.status} ${selectedServerId === server.id ? 'selected' : ''}`}
            onClick={() => setSelectedServerId(selectedServerId === server.id ? null : server.id)}
          >
            <div className="server-header">
              <div className="server-info">
                <h4 className="server-name">{server.name}</h4>
                <span className="server-ip">{server.ip} • {server.type}</span>
              </div>
              <span 
                className="server-status" 
                style={{ backgroundColor: getStatusColor(server.status) }}
              >
                {getStatusLabel(server.status)}
              </span>
            </div>

            {server.status === 'online' && server.cpu !== undefined && (
              <div className="server-metrics">
                <div className="metric">
                  <div className="metric-value-row">
                    <span className="metric-value" style={{ color: server.cpu > 80 ? '#dc2626' : '#10b981' }}>
                      {server.cpu}%
                    </span>
                  </div>
                  <span className="metric-label">CPU</span>
                  {server.cpuModel && <span className="metric-detail">{server.cpuModel}</span>}
                </div>
                <div className="metric">
                  <div className="metric-value-row">
                    <span className="metric-value" style={{ color: server.memory && server.memory > 80 ? '#dc2626' : '#3b82f6' }}>
                      {server.memory}%
                    </span>
                  </div>
                  <span className="metric-label">RAM</span>
                  {server.ramTotalGb && <span className="metric-detail">{server.ramTotalGb} GB</span>}
                </div>
                <div className="metric">
                  <div className="metric-value-row">
                    <span className="metric-value" style={{ color: server.disk && server.disk > 80 ? '#dc2626' : '#f59e0b' }}>
                      {server.disk}%
                    </span>
                  </div>
                  <span className="metric-label">DISK</span>
                  {server.diskTotalGb && <span className="metric-detail">{server.diskTotalGb} GB</span>}
                </div>
              </div>
            )}

            {server.status !== 'online' && (
              <div className="server-offline-msg">
                Aucune donnée disponible
              </div>
            )}

            {server.lastSeen && (
              <div className="server-lastseen">
                Dernière connexion: {new Date(server.lastSeen).toLocaleString()}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal de détails du serveur */}
      {selectedServer && (
        <ServerDetailModal
          server={selectedServer}
          onClose={() => setSelectedServerId(null)}
        />
      )}

      <div className="servers-footer">
        <div className="stats-row">
          <div className="stat">
            <span className="stat-value">{servers.length}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat">
            <span className="stat-value" style={{ color: '#10b981' }}>{onlineCount}</span>
            <span className="stat-label">En ligne</span>
          </div>
          <div className="stat">
            <span className="stat-value" style={{ color: '#dc2626' }}>{offlineCount}</span>
            <span className="stat-label">Hors ligne</span>
          </div>
          <div className="stat">
            <span className="stat-value" style={{ color: '#f59e0b' }}>{warningCount}</span>
            <span className="stat-label">Alertes</span>
          </div>
        </div>
      </div>
    </div>
  );
};