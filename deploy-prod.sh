#!/bin/bash
# Deploy Horus Dashboard V2 - Production (Port 8082)
# Usage: ./deploy-prod.sh

set -e

echo "🚀 Deployment Production - Port 8082"
echo "======================================"

cd /home/ubuntu/.openclaw/workspace/dashboard-v2

# Switch to main branch
echo "📦 Switching to main branch..."
git checkout main
git pull origin main

# Install production dependencies only
echo "📦 Installing dependencies (production only)..."
npm install --production

# Copy production env
echo "⚙️  Configuring production environment..."
cp .env.production .env

# Build frontend if applicable
if [ -f "package.json" ] && grep -q '"build"' package.json; then
    echo "🔨 Building frontend..."
    npm run build
fi

# Restart PM2 production instance
echo "🔄 Restarting PM2 production instance..."
pm2 restart horus-dashboard-prod --env production || pm2 start ecosystem.config.js --name horus-dashboard-prod --env production

echo "✅ Production deployed successfully on port 8082!"
echo "📊 View logs: pm2 logs horus-dashboard-prod"
echo "🔗 Access: http://localhost:8082"
