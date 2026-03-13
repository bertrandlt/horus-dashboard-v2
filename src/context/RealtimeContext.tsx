import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

interface MetricData {
  timestamp: number;
  cpu: number;
  memory: number;
  disk: number;
}

interface RealtimeContextType {
  metrics: MetricData[];
  isConnected: boolean;
  lastUpdate: Date | null;
  error: string | null;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch initial history
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`${API_URL}/api/metrics/history?period=1d`);
        const data = await response.json();
        setMetrics(data.map((m: any) => ({
          timestamp: m.timestamp,
          cpu: m.cpu,
          memory: m.memory,
          disk: m.disk
        })));
      } catch (err) {
        console.error('Failed to fetch history:', err);
        setError('Failed to fetch initial data');
      }
    };

    fetchHistory();
  }, []);

  // WebSocket connection
  useEffect(() => {
    const connect = () => {
      try {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('WebSocket connected');
          setIsConnected(true);
          setError(null);
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            if (message.type === 'metrics') {
              setMetrics(prev => {
                const updated = [...prev, {
                  timestamp: message.data.timestamp,
                  cpu: message.data.cpu,
                  memory: message.data.memory,
                  disk: message.data.disk
                }];
                return updated.slice(-50);
              });
              setLastUpdate(new Date());
            }
          } catch (err) {
            console.error('Failed to parse message:', err);
          }
        };

        ws.onclose = () => {
          console.log('WebSocket disconnected');
          setIsConnected(false);
          // Reconnect after 3 seconds
          setTimeout(connect, 3000);
        };

        ws.onerror = (err) => {
          console.error('WebSocket error:', err);
          setError('Connection error');
        };
      } catch (err) {
        console.error('Failed to connect:', err);
        setError('Failed to connect to server');
      }
    };

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <RealtimeContext.Provider value={{ metrics, isConnected, lastUpdate, error }}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within RealtimeProvider');
  }
  return context;
};

// API client
export const api = {
  getServices: async () => {
    const res = await fetch(`${API_URL}/api/services`);
    return res.json();
  },
  
  getSLOs: async () => {
    const res = await fetch(`${API_URL}/api/slos`);
    return res.json();
  },
  
  getInsights: async () => {
    const res = await fetch(`${API_URL}/api/insights`);
    return res.json();
  },
  
  getMetricsHistory: async (period: string = '30d') => {
    const res = await fetch(`${API_URL}/api/metrics/history?period=${period}`);
    return res.json();
  }
};
