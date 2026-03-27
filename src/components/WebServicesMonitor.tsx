import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Cloud, 
  Database, 
  Activity, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  AlertTriangle,
  Globe
} from 'lucide-react';

interface Service {
  name: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  response_time_ms?: number;
  http_code?: number;
  error_message?: string;
  last_check: string;
}

interface Infrastructure {
  total: number;
  healthy: number;
  unhealthy: number;
  services: Service[];
}

interface WebServicesStatus {
  timestamp: string;
  total_services: number;
  healthy: number;
  unhealthy: number;
  by_infrastructure: Record<string, Infrastructure>;
}

const infrastructureIcons: Record<string, React.ReactNode> = {
  coolify: <Cloud className="w-6 h-6" />,
  'clawbot-local': <Server className="w-6 h-6" />,
  portainer: <Database className="w-6 h-6" />,
};

const infrastructureNames: Record<string, string> = {
  coolify: 'Coolify PaaS',
  'clawbot-local': 'Clawbot Local',
  portainer: 'Portainer Hosting',
};

export default function WebServicesMonitor() {
  const [status, setStatus] = useState<WebServicesStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // API URL configuration - use full URL for production build
  const getApiUrl = () => {
    // Check if we're running from static server (production build)
    const isStaticServer = window.location.port === '8083' || window.location.port === '8082';
    if (isStaticServer) {
      const apiPort = window.location.port === '8083' ? '3003' : '3002';
      return `http://${window.location.hostname}:${apiPort}`;
    }
    // Development mode with Vite proxy
    return '';
  };

  const API_BASE = getApiUrl();

  const fetchStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/web-services/status`);
      if (!response.ok) throw new Error('Failed to fetch status');
      const data = await response.json();
      setStatus(data);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use API port for WebSocket in production build
    const isStaticServer = window.location.port === '8083' || window.location.port === '8082';
    const wsPort = isStaticServer 
      ? (window.location.port === '8083' ? '3003' : '3002')
      : window.location.port;
    const wsUrl = `${wsProtocol}//${window.location.hostname}:${wsPort}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'web-services-update') {
        setStatus(message.data);
        setLastUpdate(new Date());
      }
    };

    return () => ws.close();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-3 text-gray-600">Loading services status...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
          <div>
            <h3 className="text-red-800 font-semibold">Error loading services</h3>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!status) return null;

  const overallHealth = status.healthy === status.total_services 
    ? 'healthy' 
    : status.unhealthy > 0 
      ? 'degraded' 
      : 'healthy';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Globe className="w-7 h-7 mr-3 text-blue-600" />
            Web Services Monitor
          </h2>
          <p className="text-gray-500 mt-1">
            Real-time monitoring of all infrastructure services
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">
            Last update: {lastUpdate.toLocaleTimeString()}
          </span>
          <button
            onClick={fetchStatus}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Overall Status Card */}
      <div className={`rounded-xl p-6 ${
        overallHealth === 'healthy' 
          ? 'bg-green-50 border border-green-200' 
          : 'bg-yellow-50 border border-yellow-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {overallHealth === 'healthy' ? (
              <CheckCircle className="w-10 h-10 text-green-500 mr-4" />
            ) : (
              <AlertTriangle className="w-10 h-10 text-yellow-500 mr-4" />
            )}
            <div>
              <h3 className={`text-xl font-semibold ${
                overallHealth === 'healthy' ? 'text-green-800' : 'text-yellow-800'
              }`}>
                {overallHealth === 'healthy' ? 'All Systems Operational' : 'Some Services Degraded'}
              </h3>
              <p className={`${
                overallHealth === 'healthy' ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {status.healthy} of {status.total_services} services healthy
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900">
              {((status.healthy / status.total_services) * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500">Uptime</div>
          </div>
        </div>
      </div>

      {/* Infrastructure Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(status.by_infrastructure).map(([key, infra]) => (
          <div key={key} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Card Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-blue-50 rounded-lg mr-3">
                  {infrastructureIcons[key] || <Server className="w-6 h-6 text-blue-600" />}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {infrastructureNames[key] || key}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {infra.total} services
                  </p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                infra.unhealthy === 0 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {infra.unhealthy === 0 ? 'Healthy' : `${infra.unhealthy} issues`}
              </div>
            </div>

            {/* Services List */}
            <div className="divide-y divide-gray-100">
              {infra.services.map((service) => (
                <div key={service.name} className="px-6 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {service.status === 'healthy' ? (
                        <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 mr-3" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{service.name}</p>
                        {service.error_message && (
                          <p className="text-sm text-red-600">{service.error_message}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {service.response_time_ms && (
                        <p className="text-sm text-gray-500">
                          {service.response_time_ms}ms
                        </p>
                      )}
                      <p className="text-xs text-gray-400">
                        {new Date(service.last_check).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{status.healthy}</p>
              <p className="text-sm text-gray-500">Healthy</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center">
            <XCircle className="w-8 h-8 text-red-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{status.unhealthy}</p>
              <p className="text-sm text-gray-500">Unhealthy</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center">
            <Server className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{status.total_services}</p>
              <p className="text-sm text-gray-500">Total Services</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center">
            <Activity className="w-8 h-8 text-purple-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {Object.keys(status.by_infrastructure).length}
              </p>
              <p className="text-sm text-gray-500">Infrastructures</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
