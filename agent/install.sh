#!/bin/bash
# Horus Agent Installation Script for Ubuntu 24+
# Usage: curl -sSL http://192.168.100.30:8082/agent/install.sh | sudo bash -s -- SERVER_ID

set -e

SERVER_ID=${1:-$(hostname)}
API_URL=${2:-"http://192.168.100.30:3002"}
AGENT_URL="http://192.168.100.30:8082/agent/horus-agent.py"
VENV_DIR="/opt/horus-agent-venv"

echo "🚀 Installing Horus Agent..."
echo "   Server ID: $SERVER_ID"
echo "   API URL: $API_URL"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

# Install system dependencies
echo "📦 Installing system dependencies..."
apt-get update -qq
apt-get install -y -qq python3 python3-venv python3-pip curl

# Create virtual environment
echo "🐍 Creating Python virtual environment..."
if [ -d "$VENV_DIR" ]; then
    rm -rf "$VENV_DIR"
fi
python3 -m venv "$VENV_DIR"
source "$VENV_DIR/bin/activate"

# Install Python packages in venv
echo "📦 Installing Python packages..."
pip install -q psutil requests

# Download agent
echo "⬇️  Downloading agent..."
curl -sSL "$AGENT_URL" -o /usr/local/bin/horus-agent
chmod +x /usr/local/bin/horus-agent

# Update shebang to use venv python
sed -i "1s|#!/usr/bin/env python3|#!$VENV_DIR/bin/python3|" /usr/local/bin/horus-agent

# Create systemd service
echo "⚙️  Creating systemd service..."
cat > /etc/systemd/system/horus-agent.service << EOF
[Unit]
Description=Horus Agent - System Metrics Collector
After=network.target

[Service]
Type=simple
ExecStart=$VENV_DIR/bin/python3 /usr/local/bin/horus-agent --server-id $SERVER_ID --api-url $API_URL --interval 60
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
systemctl daemon-reload
systemctl enable horus-agent
systemctl start horus-agent

echo ""
echo "✅ Horus Agent installed successfully!"
echo ""
echo "Commands:"
echo "  Status:  sudo systemctl status horus-agent"
echo "  Logs:    sudo journalctl -u horus-agent -f"
echo "  Restart: sudo systemctl restart horus-agent"
echo "  Stop:    sudo systemctl stop horus-agent"
echo ""
echo "Server will appear on dashboard: http://192.168.100.30:8082/"
