// frontend/src/components/dashboard/Dashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { useWebSocket } from '../../hooks/useWebSocket';
import { alertService, AlertMetrics } from '../../services/api/alertService';
import { incidentService, IncidentMetrics } from '../../services/api/incidentService';
import { formatNumber, formatDuration } from '../../utils/formatters';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { PriorityChart } from './PriorityChart';
import { ActivityFeed } from './ActivityFeed';
import { MetricsPanel } from './MetricsPanel';

interface DashboardProps {
  timeRange?: '1h' | '24h' | '7d' | '30d';
  jurisdiction?: string;
}

const Dashboard: React.FC<DashboardProps> = ({
  timeRange = '24h',
  jurisdiction
}) => {
  const { user, hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [refreshInterval, setRefreshInterval] = useState<number>(30); // seconds

  // WebSocket for real-time updates
  const { lastMessage, isConnected } = useWebSocket(
    '/topic/dashboard.metrics',
    {
      autoConnect: true,
      onMessage: (data) => {
        // Update cache with new data
        queryClient.setQueryData(['dashboard-metrics'], data);
        queryClient.setQueryData(['incident-metrics'], data.incidentMetrics);
        setLastUpdate(new Date());
      }
    }
  );

  // Fetch dashboard metrics
  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useQuery({
    queryKey: ['dashboard-metrics', timeRange, jurisdiction],
    queryFn: () => alertService.getMetrics(),
    refetchInterval: autoRefresh ? refreshInterval * 1000 : false,
    staleTime: 10 * 1000, // 10 seconds
  });

  // Fetch incident metrics
  const { data: incidentMetrics, isLoading: incidentsLoading } = useQuery({
    queryKey: ['incident-metrics', timeRange],
    queryFn: () => incidentService.getMetrics(),
    refetchInterval: autoRefresh ? refreshInterval * 1000 : false,
  });

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      try {
        const update = JSON.parse(lastMessage);
        handleRealTimeUpdate(update);
      } catch (error) {
        console.error('Failed to parse dashboard update:', error);
      }
    }
  }, [lastMessage]);

  const handleRealTimeUpdate = useCallback((update: any) => {
    switch (update.type) {
      case 'ALERT_CREATED':
        // Invalidate alerts query to trigger refetch
        queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
        break;
      case 'INCIDENT_CREATED':
        queryClient.invalidateQueries({ queryKey: ['incident-metrics'] });
        break;
      case 'METRICS_UPDATE':
        // Update metrics directly
        queryClient.setQueryData(['dashboard-metrics'], update.metrics);
        break;
    }
  }, [queryClient]);

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    queryClient.invalidateQueries({ queryKey: ['incident-metrics'] });
    setLastUpdate(new Date());
  }, [queryClient]);

  const getPriorityColor = (priority: string): string => {
    const colors: Record<string, string> = {
      LOW: 'text-green-600 bg-green-100',
      MEDIUM: 'text-yellow-600 bg-yellow-100',
      HIGH: 'text-orange-600 bg-orange-100',
      CRITICAL: 'text-red-600 bg-red-100'
    };
    return colors[priority] || 'text-gray-600 bg-gray-100';
  };

  if (metricsLoading || incidentsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (metricsError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-semibold text-lg">Error Loading Dashboard</h3>
        <p className="text-red-600 mt-2">
          Failed to load dashboard data. Please try again.
        </p>
        <button
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operations Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Real-time monitoring and analytics
            {jurisdiction && <span className="ml-2 font-medium">| {jurisdiction}</span>}
          </p>
        </div>
        
        <div className="mt-4 md:mt-0 flex items-center space-x-4">
          <div className="flex items-center">
            <span className={`inline-block w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="text-sm text-gray-600">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="mr-2"
              />
              Auto-refresh
            </label>
            
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
              disabled={!autoRefresh}
            >
              <option value="10">10s</option>
              <option value="30">30s</option>
              <option value="60">1m</option>
              <option value="300">5m</option>
            </select>
            
            <button
              onClick={handleRefresh}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricsPanel
          title="Total Alerts"
          value={formatNumber(metrics?.totalAlerts || 0)}
          change={`+${formatNumber(metrics?.alertsLastHour || 0)} last hour`}
          icon="🔔"
          color="blue"
        />
        
        <MetricsPanel
          title="Active Incidents"
          value={formatNumber(incidentMetrics?.activeIncidents || 0)}
          change={`${formatNumber(incidentMetrics?.incidentsLast24Hours || 0)} last 24h`}
          icon="🚨"
          color="red"
        />
        
        <MetricsPanel
          title="Avg Response Time"
          value={formatDuration(metrics?.averageResponseTime || 0)}
          change=""
          icon="⏱️"
          color="green"
        />
        
        <MetricsPanel
          title="Unresolved Critical"
          value={formatNumber(metrics?.unresolvedCritical || 0)}
          change="Requires attention"
          icon="⚠️"
          color="orange"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Priority Distribution */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Alert Priority Distribution</h2>
              <select className="border border-gray-300 rounded px-3 py-1 text-sm">
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>
            
            <PriorityChart
              data={metrics?.alertsByPriority || {}}
              height={300}
            />
            
            {/* Priority Breakdown */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(metrics?.alertsByPriority || {}).map(([priority, count]) => (
                <div key={priority} className="text-center">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${getPriorityColor(priority)}`}>
                    <span className="font-bold">{count}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-gray-700">{priority}</p>
                  <p className="text-xs text-gray-500">Alerts</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Source Distribution */}
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Alert Sources</h2>
            <div className="space-y-3">
              {Object.entries(metrics?.alertsBySource || {}).map(([source, count]) => (
                <div key={source} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{source.replace('_', ' ')}</span>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${(count / (metrics?.totalAlerts || 1)) * 100}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Activity Feed */}
        <div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              <span className="text-xs text-gray-500">
                Updated {lastUpdate.toLocaleTimeString()}
              </span>
            </div>
            
            <ActivityFeed
              limit={10}
              showAlerts={true}
              showIncidents={true}
            />
            
            {/* Quick Actions */}
            {hasRole('OFFICER') && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => window.location.href = '/alerts/new'}
                    className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 text-left"
                  >
                    + Create New Alert
                  </button>
                  <button
                    onClick={() => window.location.href = '/incidents?priority=CRITICAL'}
                    className="w-full px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 text-left"
                  >
                    View Critical Incidents
                  </button>
                  <button
                    onClick={() => window.location.href = '/map'}
                    className="w-full px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 text-left"
                  >
                    Open Live Map
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* System Status */}
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">API Connectivity</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Database</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Healthy
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Kafka Streams</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">WebSocket</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Last Update Footer */}
      <div className="mt-6 text-center text-sm text-gray-500">
        Last updated: {lastUpdate.toLocaleString()} | 
        Data refresh: {autoRefresh ? `${refreshInterval}s` : 'Manual'} | 
        Version: {process.env.REACT_APP_VERSION || '1.0.0'}
      </div>
    </div>
  );
};

export default Dashboard;