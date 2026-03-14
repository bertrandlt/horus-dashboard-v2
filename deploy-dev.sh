#!/bin/bash
# Deploy Horus Dashboard V2 - Development (Port 8083)
# Usage: ./deploy-dev.sh

set -e

echo "🔧 Deployment Development - Port 8083"
echo "======================================"

cd /home/ubuntu/.openclaw/workspace/dashboard-v2

# Switch to develop branch
echo "📦 Switching to develop branch..."
git checkout develop
git pull origin develop

# Install all dependencies (including devDependencies)
echo "📦 Installing dependencies (all)..."
npm install

# Copy development env
echo "⚙️  Configuring development environment..."
cp .env.development .env

# Build frontend if applicable
if [ -f "package.json" ] && grep -q '"build"' package.json; then
    echo "🔨 Building frontend..."
    npm run build
fi

# Restart PM2 development instance
echo "🔄 Restarting PM2 development instance..."
pm2 restart horus-dashboard-dev --env development || pm2 start ecosystem.config.js --name horus-dashboard-dev --env development

echo "✅ Development deployed successfully on port 8083!"
echo "📊 View logs: pm2 logs horus-dashboard-dev"
echo "🔗 Access: http://localhost:8083"
