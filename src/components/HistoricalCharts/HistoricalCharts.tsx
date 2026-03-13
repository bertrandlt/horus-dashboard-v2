import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import './HistoricalCharts.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface MetricData {
  labels: string[];
  cpu: number[];
  memory: number[];
  disk: number[];
}

interface HistoricalChartsProps {
  data?: MetricData;
  period?: '7d' | '30d' | '90d';
  onPeriodChange?: (period: '7d' | '30d' | '90d') => void;
}

const defaultData: MetricData = {
  labels: ['J-30', 'J-25', 'J-20', 'J-15', 'J-10', 'J-5', 'Auj.'],
  cpu: [45, 52, 48, 61, 55, 49, 58],
  memory: [62, 65, 68, 72, 70, 69, 74],
  disk: [78, 79, 80, 81, 82, 83, 85]
};

export const HistoricalCharts: React.FC<HistoricalChartsProps> = ({ 
  data = defaultData, 
  period = '30d',
  onPeriodChange 
}) => {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'CPU',
        data: data.cpu,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Mémoire',
        data: data.memory,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Disque',
        data: data.disk,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'start' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: '#e5e7eb',
        },
        ticks: {
          callback: function(tickValue: string | number) {
            return `${tickValue}%`;
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  const avgCpu = Math.round(data.cpu.reduce((a, b) => a + b, 0) / data.cpu.length);
  const avgMemory = Math.round(data.memory.reduce((a, b) => a + b, 0) / data.memory.length);
  const currentDisk = data.disk[data.disk.length - 1];

  return (
    <div className="widget historical-charts">
      <div className="widget-header">
        <h3>📈 Historique {period === '7d' ? '7' : period === '30d' ? '30' : '90'} jours</h3>
        <div className="time-filter">
          {(['7d', '30d', '90d'] as const).map((p) => (
            <button
              key={p}
              className={period === p ? 'active' : ''}
              onClick={() => onPeriodChange?.(p)}
            >
              {p === '7d' ? '7J' : p === '30d' ? '30J' : '90J'}
            </button>
          ))}
        </div>
      </div>
      
      <div className="chart-container">
        <Line data={chartData} options={options} />
      </div>
      
      <div className="stats-row">
        <div className="stat">
          <span className="stat-value">{avgCpu}%</span>
          <span className="stat-label">CPU moyen</span>
        </div>
        <div className="stat">
          <span className="stat-value">{avgMemory}%</span>
          <span className="stat-label">RAM moyenne</span>
        </div>
        <div className="stat">
          <span className="stat-value">{currentDisk}%</span>
          <span className={`stat-label ${currentDisk > 80 ? 'alert' : ''}`}>
            Disque {currentDisk > 80 ? '⚠️' : ''}
          </span>
        </div>
      </div>
    </div>
  );
};
