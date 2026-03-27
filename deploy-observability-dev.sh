#!/bin/bash
# Deploy Horus Observability Dashboard - DEVELOPMENT
# Port: 8083

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DASHBOARD_DIR="$SCRIPT_DIR"
API_DIR="$DASHBOARD_DIR/api"
FRONTEND_DIR="$DASHBOARD_DIR/dist"

# Configuration DEV
DEV_PORT=8083
API_PORT=3003

echo "🚀 Deploying Horus Observability Dashboard - DEVELOPMENT"
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
}

# Check if we're on develop branch
cd "$DASHBOARD_DIR"
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "develop" ]; then
    warn "Current branch is '$CURRENT_BRANCH', not 'develop'"
    read -p "Switch to develop branch? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git checkout develop
        git pull origin develop
    fi
fi

# Install dependencies if needed
if [ ! -d "$DASHBOARD_DIR/node_modules" ]; then
    log "Installing dependencies..."
    cd "$DASHBOARD_DIR"
    npm install
fi

# Check for sqlite3
if ! npm list sqlite3 > /dev/null 2>&1; then
    log "Installing sqlite3..."
    cd "$DASHBOARD_DIR"
    npm install sqlite3
fi

# Build frontend
log "Building frontend for development..."
cd "$DASHBOARD_DIR"
npm run build

# Kill existing processes on DEV ports
log "Stopping existing DEV services..."
pkill -f "node.*web-services-server.*$API_PORT" 2>/dev/null || true
pkill -f "python3.*horus_web_monitor" 2>/dev/null || true
fuser -k $DEV_PORT/tcp 2>/dev/null || true
fuser -k $API_PORT/tcp 2>/dev/null || true
sleep 2

# Start the web services monitor in background
log "Starting Web Services Monitor..."
nohup python3 /home/ubuntu/horus_web_monitor.py --daemon --interval 60 > /tmp/web-monitor-dev.log 2>&1 &
WEB_MONITOR_PID=$!
echo $WEB_MONITOR_PID > /tmp/web-monitor-dev.pid
log "Web Monitor PID: $WEB_MONITOR_PID"

# Start the API server (web services enhanced)
log "Starting API server on port $API_PORT..."
cd "$API_DIR"
PORT=$API_PORT nohup node web-services-server.js > /tmp/dashboard-api-dev.log 2>&1 &
API_PID=$!
echo $API_PID > /tmp/dashboard-api-dev.pid
log "API PID: $API_PID"

# Wait for API to be ready
sleep 3

# Start frontend server
log "Starting frontend on port $DEV_PORT..."
cd "$FRONTEND_DIR"
nohup python3 -m http.server $DEV_PORT > /tmp/dashboard-frontend-dev.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > /tmp/dashboard-frontend-dev.pid
log "Frontend PID: $FRONTEND_PID"

# Save all PIDs
cat > /tmp/horus-observability-dev.pids << EOF
WEB_MONITOR_PID=$WEB_MONITOR_PID
API_PID=$API_PID
FRONTEND_PID=$FRONTEND_PID
EOF

echo ""
echo "========================================================"
log "✅ DEVELOPMENT deployment complete!"
echo ""
echo "🌐 Dashboard:    http://192.168.100.30:$DEV_PORT"
echo "🔌 API:          http://192.168.100.30:$API_PORT"
echo "📊 WebSocket:    ws://192.168.100.30:$API_PORT"
echo ""
echo "Services Monitored:"
echo "  • Coolify PaaS (88.214.58.99)"
echo "  • Clawbot Local (192.168.100.30)"
echo "  • Portainer Hosting (193.203.238.165)"
echo ""
echo "Logs:"
echo "  Web Monitor:  tail -f /tmp/web-monitor-dev.log"
echo "  API:          tail -f /tmp/dashboard-api-dev.log"
echo "  Frontend:     tail -f /tmp/dashboard-frontend-dev.log"
echo ""
echo "Stop with: kill $WEB_MONITOR_PID $API_PID $FRONTEND_PID"
echo "========================================================"
