#!/usr/bin/env python3
"""
Horus Agent - Collecte et envoi des métriques système
Compatible Linux (Ubuntu/Debian/CentOS)
"""

import psutil
import requests
import json
import time
import socket
import argparse
from datetime import datetime
from pathlib import Path

class HorusAgent:
    def __init__(self, server_id, api_url, interval=60):
        self.server_id = server_id
        self.api_url = api_url.rstrip('/')
        self.interval = interval
        self.hostname = socket.gethostname()
        self.ip = self._get_ip()
        
    def _get_ip(self):
        """Get primary IP address"""
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except:
            return "127.0.0.1"
    
    def collect_metrics(self):
        """Collect system metrics"""
        cpu = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        load = psutil.getloadavg() if hasattr(psutil, 'getloadavg') else (0, 0, 0)
        
        # Network connections
        connections = len(psutil.net_connections())
        
        # Uptime
        boot_time = psutil.boot_time()
        uptime_days = (time.time() - boot_time) / 86400
        
        # Top processes by CPU
        processes = []
        for proc in psutil.process_iter(['pid', 'name', 'cpu_percent']):
            try:
                processes.append({
                    'pid': proc.info['pid'],
                    'name': proc.info['name'],
                    'cpu': proc.info['cpu_percent']
                })
            except:
                pass
        
        top_processes = sorted(processes, key=lambda x: x['cpu'], reverse=True)[:5]
        
        # Failed services (systemd)
        failed_services = []
        try:
            import subprocess
            result = subprocess.run(['systemctl', '--failed', '--no-legend'], 
                                  capture_output=True, text=True, timeout=5)
            for line in result.stdout.strip().split('\n'):
                if line:
                    failed_services.append(line.split()[0])
        except:
            pass
        
        # CPU Model
        cpu_model = "Unknown"
        try:
            with open('/proc/cpuinfo', 'r') as f:
                for line in f:
                    if line.startswith('model name'):
                        cpu_model = line.split(':')[1].strip()
                        break
        except:
            pass
        
        metrics = {
            'server_id': self.server_id,
            'hostname': self.hostname,
            'ip': self.ip,
            'timestamp': datetime.now().isoformat(),
            'cpu_percent': round(cpu, 1),
            'cpu_model': cpu_model,
            'ram_percent': round(memory.percent, 1),
            'ram_used_gb': round(memory.used / (1024**3), 2),
            'ram_total_gb': round(memory.total / (1024**3), 2),
            'disk_percent': round(disk.percent, 1),
            'disk_used_gb': round(disk.used / (1024**3), 2),
            'disk_free_gb': round(disk.free / (1024**3), 2),
            'disk_total_gb': round(disk.total / (1024**3), 2),
            'load_avg': round(load[0], 2),
            'uptime_days': round(uptime_days, 2),
            'network_connections': connections,
            'top_processes': top_processes,
            'failed_services': failed_services
        }
        
        return metrics
    
    def send_metrics(self, metrics):
        """Send metrics to API"""
        try:
            response = requests.post(
                f"{self.api_url}/api/agents/metrics",
                json=metrics,
                timeout=10,
                headers={'Content-Type': 'application/json'}
            )
            return response.status_code == 200
        except Exception as e:
            print(f"[{datetime.now()}] Error sending metrics: {e}")
            return False
    
    def run(self):
        """Main loop"""
        print(f"🚀 Horus Agent started")
        print(f"   Server: {self.server_id}")
        print(f"   API: {self.api_url}")
        print(f"   Interval: {self.interval}s")
        print(f"   IP: {self.ip}")
        
        while True:
            try:
                metrics = self.collect_metrics()
                success = self.send_metrics(metrics)
                
                status = "✅ Sent" if success else "❌ Failed"
                print(f"[{datetime.now()}] {status} - CPU: {metrics['cpu_percent']}% | "
                      f"RAM: {metrics['ram_percent']}% | Disk: {metrics['disk_percent']}%")
                
            except Exception as e:
                print(f"[{datetime.now()}] Error: {e}")
            
            time.sleep(self.interval)

def install_service():
    """Install as systemd service"""
    service_content = """[Unit]
Description=Horus Agent
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/horus-agent --server-id SERVER_ID --api-url API_URL
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
"""
    
    print("Installing systemd service...")
    
    # Copy binary
    agent_path = Path(__file__).resolve()
    target_path = Path("/usr/local/bin/horus-agent")
    
    import shutil
    shutil.copy(agent_path, target_path)
    target_path.chmod(0o755)
    
    print(f"✅ Agent installed to {target_path}")
    print("\nTo complete installation:")
    print("1. Edit /etc/systemd/system/horus-agent.service")
    print("2. Replace SERVER_ID and API_URL with your values")
    print("3. Run: sudo systemctl daemon-reload")
    print("4. Run: sudo systemctl enable --now horus-agent")
    print("\nExample service file:")
    print(service_content)

def main():
    parser = argparse.ArgumentParser(description='Horus Agent - System metrics collector')
    parser.add_argument('--server-id', required=True, help='Unique server identifier')
    parser.add_argument('--api-url', default='http://192.168.100.30:3002', help='Dashboard API URL')
    parser.add_argument('--interval', type=int, default=60, help='Collection interval in seconds')
    parser.add_argument('--install', action='store_true', help='Install as systemd service')
    
    args = parser.parse_args()
    
    if args.install:
        install_service()
        return
    
    agent = HorusAgent(args.server_id, args.api_url, args.interval)
    agent.run()

if __name__ == '__main__':
    main()
