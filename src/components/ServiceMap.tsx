import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './ServiceMap.css';

interface Service {
  id: string;
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  x: number;
  y: number;
}

interface Connection {
  from: string;
  to: string;
}

const services: Service[] = [
  { id: 'lb', name: 'Load Balancer', status: 'healthy', x: 300, y: 50 },
  { id: 'api', name: 'API Gateway', status: 'healthy', x: 300, y: 120 },
  { id: 'auth', name: 'Auth Service', status: 'healthy', x: 150, y: 190 },
  { id: 'user', name: 'User Service', status: 'warning', x: 300, y: 190 },
  { id: 'order', name: 'Order Service', status: 'healthy', x: 450, y: 190 },
  { id: 'db', name: 'PostgreSQL', status: 'healthy', x: 225, y: 260 },
  { id: 'cache', name: 'Redis', status: 'healthy', x: 375, y: 260 },
];

const connections: Connection[] = [
  { from: 'lb', to: 'api' },
  { from: 'api', to: 'auth' },
  { from: 'api', to: 'user' },
  { from: 'api', to: 'order' },
  { from: 'auth', to: 'db' },
  { from: 'user', to: 'db' },
  { from: 'order', to: 'db' },
  { from: 'user', to: 'cache' },
  { from: 'order', to: 'cache' },
];

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'healthy': return '#10b981';
    case 'warning': return '#f59e0b';
    case 'critical': return '#dc2626';
    default: return '#6b7280';
  }
};

export const ServiceMap: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Draw connections
    connections.forEach((conn) => {
      const fromService = services.find((s) => s.id === conn.from);
      const toService = services.find((s) => s.id === conn.to);
      if (!fromService || !toService) return;

      svg.append('line')
        .attr('x1', fromService.x)
        .attr('y1', fromService.y)
        .attr('x2', toService.x)
        .attr('y2', toService.y)
        .attr('stroke', '#d1d5db')
        .attr('stroke-width', 2);
    });

    // Draw services
    services.forEach((service) => {
      const color = getStatusColor(service.status);
      
      // Outer glow
      svg.append('circle')
        .attr('cx', service.x)
        .attr('cy', service.y)
        .attr('r', 25)
        .attr('fill', color)
        .attr('opacity', 0.2);

      // Main circle
      svg.append('circle')
        .attr('cx', service.x)
        .attr('cy', service.y)
        .attr('r', 18)
        .attr('fill', color);

      // Label
      svg.append('text')
        .attr('x', service.x)
        .attr('y', service.y + 40)
        .attr('text-anchor', 'middle')
        .attr('font-size', '11px')
        .attr('fill', '#374151')
        .attr('font-weight', '500')
        .text(service.name);
    });
  }, []);

  const healthyCount = services.filter((s) => s.status === 'healthy').length;
  const warningCount = services.filter((s) => s.status === 'warning').length;
  const criticalCount = services.filter((s) => s.status === 'critical').length;

  return (
    <div className="widget service-map">
      <div className="widget-header">
        <h3>🗺️ Carte des Services</h3>
        <div className="legend">
          <span className="status-dot healthy">● Healthy</span>
          <span className="status-dot warning">● Warning</span>
          <span className="status-dot critical">● Critical</span>
        </div>
      </div>
      
      <svg ref={svgRef} viewBox="0 0 600 300" className="topology-map">
        {/* D3 will render here */}
      </svg>
      
      <div className="service-stats">
        <div className="service-stat">
          <span className="count healthy">{healthyCount}</span>
          <span className="label">Healthy</span>
        </div>
        <div className="service-stat">
          <span className="count warning">{warningCount}</span>
          <span className="label">Warning</span>
        </div>
        <div className="service-stat">
          <span className="count critical">{criticalCount}</span>
          <span className="label">Critical</span>
        </div>
      </div>
    </div>
  );
};
