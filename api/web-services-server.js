// Web Services Monitoring API Extension for Horus Dashboard v2
// Add this to /api/server.js

const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());

// Database setup for web services monitoring
const dbPath = '/home/ubuntu/horus_web_monitor.db';
let db = null;

function initDatabase() {
  if (!fs.existsSync(dbPath)) {
    console.log('Web monitor database not found, will be created by Python script');
    return;
  }
  
  db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
      console.error('Error opening web monitor database:', err);
    } else {
      console.log('Connected to web monitor database');
    }
  });
}

initDatabase();

// Store web services metrics
const webServicesMetrics = new Map();
const webServicesHistory = new Map();

// Web Services Monitoring Endpoints

// Get current status of all web services
app.get('/api/web-services/status', (req, res) => {
  if (!db) {
    // Try to read from JSON file fallback
    const jsonPath = '/home/ubuntu/web_monitor_output/services_status.json';
    if (fs.existsSync(jsonPath)) {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      return res.json(data);
    }
    return res.status(503).json({ error: 'Database not available' });
  }
  
  const query = `
    SELECT infrastructure, server_name, service_name, status, response_time_ms, timestamp, http_code, error_message
    FROM service_checks sc1
    WHERE timestamp = (
      SELECT MAX(timestamp) 
      FROM service_checks sc2 
      WHERE sc2.infrastructure = sc1.infrastructure 
      AND sc2.service_name = sc1.service_name
    )
    ORDER BY infrastructure, service_name
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    const summary = {
      timestamp: new Date().toISOString(),
      total_services: rows.length,
      healthy: rows.filter(r => r.status === 'healthy').length,
      unhealthy: rows.filter(r => r.status === 'unhealthy').length,
      by_infrastructure: {}
    };
    
    rows.forEach(row => {
      if (!summary.by_infrastructure[row.infrastructure]) {
        summary.by_infrastructure[row.infrastructure] = {
          total: 0,
          healthy: 0,
          unhealthy: 0,
          services: []
        };
      }
      
      const infra = summary.by_infrastructure[row.infrastructure];
      infra.total++;
      if (row.status === 'healthy') {
        infra.healthy++;
      } else {
        infra.unhealthy++;
      }
      
      infra.services.push({
        name: row.service_name,
        status: row.status,
        response_time_ms: row.response_time_ms,
        http_code: row.http_code,
        error_message: row.error_message,
        last_check: row.timestamp
      });
    });
    
    res.json(summary);
  });
});

// Get service history for a specific infrastructure
app.get('/api/web-services/history/:infrastructure', (req, res) => {
  if (!db) {
    return res.status(503).json({ error: 'Database not available' });
  }
  
  const infrastructure = req.params.infrastructure;
  const hours = parseInt(req.query.hours) || 24;
  
  const query = `
    SELECT timestamp, service_name, status, response_time_ms
    FROM service_checks
    WHERE infrastructure = ?
    AND timestamp > datetime('now', '-${hours} hours')
    ORDER BY timestamp DESC
  `;
  
  db.all(query, [infrastructure], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json({
      infrastructure,
      hours,
      data: rows
    });
  });
});

// Receive metrics from Python monitor
app.post('/api/web-services/metrics', (req, res) => {
  const data = req.body;
  
  if (!data || !data.by_infrastructure) {
    return res.status(400).json({ error: 'Invalid metrics data' });
  }
  
  // Store metrics
  const timestamp = Date.now();
  webServicesMetrics.set('latest', { ...data, receivedAt: timestamp });
  
  // Add to history
  if (!webServicesHistory.has('history')) {
    webServicesHistory.set('history', []);
  }
  const history = webServicesHistory.get('history');
  history.push({ ...data, receivedAt: timestamp });
  
  // Keep only last 1000 entries
  if (history.length > 1000) {
    history.shift();
  }
  
  // Broadcast to WebSocket clients
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'web-services-update',
        data: data
      }));
    }
  });
  
  res.json({ success: true });
});

// Get all infrastructures list
app.get('/api/web-services/infrastructures', (req, res) => {
  const infrastructures = [
    { id: 'coolify', name: 'Coolify PaaS', host: '88.214.58.99', icon: 'cloud' },
    { id: 'clawbot-local', name: 'Clawbot Local', host: '192.168.100.30', icon: 'server' },
    { id: 'portainer', name: 'Portainer Hosting', host: '193.203.238.165', icon: 'docker' }
  ];
  
  res.json(infrastructures);
});

// Get uptime statistics
app.get('/api/web-services/uptime/:infrastructure/:service', (req, res) => {
  if (!db) {
    return res.status(503).json({ error: 'Database not available' });
  }
  
  const { infrastructure, service } = req.params;
  const days = parseInt(req.query.days) || 7;
  
  const query = `
    SELECT 
      COUNT(*) as total_checks,
      SUM(CASE WHEN status = 'healthy' THEN 1 ELSE 0 END) as healthy_count
    FROM service_checks
    WHERE infrastructure = ?
    AND service_name = ?
    AND timestamp > datetime('now', '-${days} days')
  `;
  
  db.get(query, [infrastructure, service], (err, row) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    const uptime = row.total_checks > 0 
      ? (row.healthy_count / row.total_checks * 100).toFixed(2)
      : 0;
    
    res.json({
      infrastructure,
      service,
      days,
      uptime_percent: parseFloat(uptime),
      total_checks: row.total_checks,
      healthy_checks: row.healthy_count
    });
  });
});

// Serve static frontend files from dist folder
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  
  // Serve index.html for all non-API routes (SPA routing)
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/ws')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// WebSocket handling
wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  // Send latest web services metrics if available
  const latest = webServicesMetrics.get('latest');
  if (latest) {
    ws.send(JSON.stringify({
      type: 'web-services-update',
      data: latest
    }));
  }
  
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Horus Web Services Monitor API running on port ${PORT}`);
  console.log(`Web Services endpoints:`);
  console.log(`  GET  /api/web-services/status`);
  console.log(`  GET  /api/web-services/infrastructures`);
  console.log(`  GET  /api/web-services/history/:infrastructure`);
  console.log(`  GET  /api/web-services/uptime/:infrastructure/:service`);
  console.log(`  POST /api/web-services/metrics`);
});
