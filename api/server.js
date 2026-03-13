const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());

// Store metrics from agents
const servers = new Map();
const metricsHistory = new Map();

// Default servers configuration - Only servers with agents installed
const defaultServers = [
  { id: 'clawbot-local', name: 'clawbot-local', ip: '192.168.100.30', type: 'main' },
  { id: 'zorin-os-vmware', name: 'zorin-os-vmware', ip: '10.8.0.40', type: 'workstation' },
  { id: 'AI-LLM-ZapHosting', name: 'ai-llm', ip: '92.42.46.14', type: 'hosting' },
];

// Initialize servers as offline with creation time
defaultServers.forEach(s => {
  servers.set(s.id, { ...s, status: 'offline', lastSeen: null, createdAt: Date.now() });
});

// IMPORTANT: Never remove servers - keep them for history even if offline
// Servers stay visible forever, marked as offline if no recent data
setInterval(() => {
  const now = Date.now();
  const TEN_MINUTES = 10 * 60 * 1000;
  
  for (const [id, server] of servers.entries()) {
    // Mark servers as offline if no data for > 10 minutes
    // But NEVER remove them - keep for history
    if (server.lastSeen) {
      const lastSeenTime = new Date(server.lastSeen).getTime();
      if (now - lastSeenTime > TEN_MINUTES && server.status === 'online') {
        console.log(`Server ${id} marked as offline (no data for 10min)`);
        server.status = 'offline';
      }
    }
  }
}, 60000); // Run every minute

// Agent endpoint - receive metrics
app.post('/api/agents/metrics', (req, res) => {
  const data = req.body;
  
  if (!data.server_id) {
    return res.status(400).json({ error: 'server_id required' });
  }
  
  // Update server status
  const server = servers.get(data.server_id) || {
    id: data.server_id,
    name: data.hostname || data.server_id,
    ip: data.ip,
    type: 'unknown'
  };
  
  servers.set(data.server_id, {
    ...server,
    status: 'online',
    lastSeen: new Date().toISOString(),
    createdAt: server.createdAt || Date.now(),
    cpu: data.cpu_percent,
    memory: data.ram_percent,
    disk: data.disk_percent,
    ramTotalGb: data.ram_total_gb || null,
    diskTotalGb: data.disk_total_gb || null,
    cpuModel: data.cpu_model || null,
    load: data.load_avg,
    uptime: data.uptime_days,
    connections: data.network_connections,
    failedServices: data.failed_services?.length || 0
  });
  
  // Store metrics history
  if (!metricsHistory.has(data.server_id)) {
    metricsHistory.set(data.server_id, []);
  }
  
  const history = metricsHistory.get(data.server_id);
  history.push({
    timestamp: data.timestamp,
    cpu: data.cpu_percent,
    memory: data.ram_percent,
    disk: data.disk_percent
  });
  
  // Keep last 1000 data points
  if (history.length > 1000) {
    history.shift();
  }
  
  // Broadcast to WebSocket clients
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'server_update',
        data: servers.get(data.server_id)
      }));
    }
  });
  
  res.json({ status: 'ok' });
});

// REST API endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.get('/api/metrics', (req, res) => {
  res.json({
    cpu: Math.round(40 + Math.random() * 30),
    memory: Math.round(60 + Math.random() * 20),
    disk: Math.min(95, Math.round(80 + Math.random() * 15)),
    timestamp: Date.now()
  });
});

app.get('/api/servers', (req, res) => {
  const serverList = Array.from(servers.values()).map(s => ({
    id: s.id,
    name: s.name,
    ip: s.ip,
    type: s.type,
    status: s.status,
    cpu: s.cpu,
    memory: s.memory,
    disk: s.disk,
    lastSeen: s.lastSeen
  }));
  res.json(serverList);
});

app.get('/api/servers/:id/metrics', (req, res) => {
  const history = metricsHistory.get(req.params.id) || [];
  res.json(history.slice(-100));
});

app.get('/api/metrics/history', (req, res) => {
  const { period = '30d' } = req.query;
  const points = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  
  const history = [];
  for (let i = points - 1; i >= 0; i--) {
    history.push({
      timestamp: Date.now() - i * 24 * 60 * 60 * 1000,
      cpu: Math.round(40 + Math.random() * 25),
      memory: Math.round(60 + Math.random() * 15),
      disk: Math.round(75 + Math.random() * 15)
    });
  }
  res.json(history);
});

app.get('/api/services', (req, res) => {
  res.json([
    { id: 'lb', name: 'Load Balancer', status: 'healthy' },
    { id: 'api', name: 'API Gateway', status: 'healthy' },
    { id: 'auth', name: 'Auth Service', status: 'healthy' },
    { id: 'user', name: 'User Service', status: Math.random() > 0.8 ? 'warning' : 'healthy' },
    { id: 'order', name: 'Order Service', status: 'healthy' },
    { id: 'db', name: 'PostgreSQL', status: 'healthy' },
    { id: 'cache', name: 'Redis', status: 'healthy' }
  ]);
});

app.get('/api/slos', (req, res) => {
  res.json([
    { name: 'Availability', target: 99.9, current: 99.95, unit: '%', status: 'met' },
    { name: 'Latency (p99)', target: 200, current: 180, unit: 'ms', status: 'met' },
    { name: 'Error Rate', target: 0.1, current: 0.08 + Math.random() * 0.1, unit: '%', status: Math.random() > 0.7 ? 'at-risk' : 'met' },
    { name: 'Throughput', target: 1000, current: 850 + Math.random() * 200, unit: 'req/s', status: 'met' }
  ]);
});

app.get('/api/insights', (req, res) => {
  res.json([
    {
      id: '1',
      type: 'prediction',
      severity: 'warning',
      title: 'Disk space will reach 90% in 5 days',
      description: 'Based on current growth rate (2%/day), storage will be critical soon.',
      timestamp: '2 min ago'
    },
    {
      id: '2',
      type: 'anomaly',
      severity: 'info',
      title: 'Unusual traffic spike detected',
      description: 'API requests increased 340% in the last hour.',
      timestamp: '15 min ago'
    }
  ]);
});

// WebSocket for real-time updates
wss.on('connection', (ws) => {
  console.log('Client connected');
  
  // Send current servers status
  const serverList = Array.from(servers.values());
  ws.send(JSON.stringify({ type: 'servers', data: serverList }));
  
  // Send metrics updates every 5 seconds
  const interval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'metrics',
        data: {
          cpu: Math.round(40 + Math.random() * 30),
          memory: Math.round(60 + Math.random() * 20),
          disk: Math.min(95, Math.round(80 + Math.random() * 15)),
          timestamp: Date.now()
        }
      }));
    }
  }, 5000);
  
  ws.on('close', () => {
    console.log('Client disconnected');
    clearInterval(interval);
  });
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket ready on ws://localhost:${PORT}`);
  console.log(`🖥️  Servers: ${servers.size} configured`);
});
