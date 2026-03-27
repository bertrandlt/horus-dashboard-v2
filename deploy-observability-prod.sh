#!/bin/bash
# Deploy Horus Observability Dashboard - PRODUCTION
# Port: 8082

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DASHBOARD_DIR="$SCRIPT_DIR"
API_DIR="$DASHBOARD_DIR/api"
FRONTEND_DIR="$DASHBOARD_DIR/dist"

# Configuration PROD
PROD_PORT=8082
API_PORT=3002

echo "🚀 Deploying Horus Observability Dashboard - PRODUCTION"
echo "========================================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%H:%M:%S')] ERROR:${NC} $1"
    exit 1
}

# Check if we're on main branch
cd "$DASHBOARD_DIR"
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    error "Must be on 'main' branch for production deployment. Current: '$CURRENT_BRANCH'"
    echo "Run: git checkout main && git pull origin main"
    exit 1
fi

# Confirm deployment
read -p "Deploy to PRODUCTION? This will affect live users. (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Deployment cancelled."
    exit 0
fi

# Pull latest changes
log "Pulling latest changes from main..."
git pull origin main

# Install dependencies
log "Installing dependencies..."
cd "$DASHBOARD_DIR"
npm ci

# Check for sqlite3
if ! npm list sqlite3 > /dev/null 2>&1; then
    log "Installing sqlite3..."
    npm install sqlite3
fi

# Build frontend for production
log "Building frontend for production..."
npm run build

# Kill existing processes on PROD ports
log "Stopping existing PROD services..."
pkill -f "node.*web-services-server.*$API_PORT" 2>/dev/null || true
pkill -f "python3.*horus_web_monitor" 2>/dev/null || true
fuser -k $PROD_PORT/tcp 2>/dev/null || true
fuser -k $API_PORT/tcp 2>/dev/null || true
sleep 2

# Start the web services monitor in background
log "Starting Web Services Monitor..."
nohup python3 /home/ubuntu/horus_web_monitor.py --daemon --interval 60 > /tmp/web-monitor-prod.log 2>&1 &
WEB_MONITOR_PID=$!
echo $WEB_MONITOR_PID > /tmp/web-monitor-prod.pid
log "Web Monitor PID: $WEB_MONITOR_PID"

# Start the API server (web services enhanced)
log "Starting API server on port $API_PORT..."
cd "$API_DIR"
PORT=$API_PORT nohup node web-services-server.js > /tmp/dashboard-api-prod.log 2>&1 &
API_PID=$!
echo $API_PID > /tmp/dashboard-api-prod.pid
log "API PID: $API_PID"

# Wait for API to be ready
sleep 3

# Start frontend server
log "Starting frontend on port $PROD_PORT..."
cd "$FRONTEND_DIR"
nohup python3 -m http.server $PROD_PORT > /tmp/dashboard-frontend-prod.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > /tmp/dashboard-frontend-prod.pid
log "Frontend PID: $FRONTEND_PID"

# Save all PIDs
cat > /tmp/horus-observability-prod.pids << EOF
WEB_MONITOR_PID=$WEB_MONITOR_PID
API_PID=$API_PID
FRONTEND_PID=$FRONTEND_PID
EOF

# Health check
log "Running health check..."
sleep 5
if curl -s http://192.168.100.30:$PROD_PORT > /dev/null; then
    log "✅ Production deployment successful!"
else
    error "Health check failed! Check logs."
fi

echo ""
echo "========================================================"
log "✅ PRODUCTION deployment complete!"
echo ""
echo "🌐 Dashboard:    http://192.168.100.30:$PROD_PORT"
echo "🔌 API:          http://192.168.100.30:$API_PORT"
echo "📊 WebSocket:    ws://192.168.100.30:$API_PORT"
echo ""
echo "Services Monitored:"
echo "  • Coolify PaaS (88.214.58.99)"
echo "  • Clawbot Local (192.168.100.30)"
echo "  • Portainer Hosting (193.203.238.165)"
echo ""
echo "Logs:"
echo "  Web Monitor:  tail -f /tmp/web-monitor-prod.log"
echo "  API:          tail -f /tmp/dashboard-api-prod.log"
echo "  Frontend:     tail -f /tmp/dashboard-frontend-prod.log"
echo ""
echo "Stop with: kill $WEB_MONITOR_PID $API_PID $FRONTEND_PID"
echo "========================================================"
