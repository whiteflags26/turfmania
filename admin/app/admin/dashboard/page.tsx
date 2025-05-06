'use client';

import {
  getHealthData,
  getMetricsData,
  MetricsData,
  SystemHealth,
} from '@/services/healthService';
import { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const [healthData, setHealthData] = useState<SystemHealth | null>(null);
  const [metricsData, setMetricsData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [health, metrics] = await Promise.all([
          getHealthData(),
          getMetricsData(),
        ]);
        setHealthData(health);
        setMetricsData(metrics);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching health data:', err);
        setError(err.message || 'Failed to load health data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-xl font-semibold text-gray-800">
          Loading system health data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white border border-red-300 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold text-red-700 mb-2">Error</h2>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!healthData) {
    return (
      <div className="p-6 bg-white border border-yellow-300 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold text-yellow-700">No Data Available</h2>
        <p className="text-gray-700">
          Unable to retrieve system health information.
        </p>
      </div>
    );
  }

  // Format bytes to a human-readable format
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-6 bg-gray-50">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        System Health Dashboard
      </h1>

      {/* Status Overview */}
      <div
        className={`p-4 mb-6 rounded-lg border shadow-sm ${
          healthData.status === 'ok'
            ? 'bg-white border-green-300 text-gray-800'
            : 'bg-white border-red-300 text-gray-800'
        }`}
      >
        <div className="flex items-center mb-2">
          <div
            className={`w-3 h-3 rounded-full mr-2 ${
              healthData.status === 'ok' ? 'bg-green-500' : 'bg-red-500'
            }`}
          ></div>
          <h2 className="text-xl font-semibold">
            System Status: {healthData.status}
          </h2>
        </div>
        <p className="text-gray-700">
          Last updated: {new Date(healthData.timestamp).toLocaleString()}
        </p>
        <p className="text-gray-700">
          Uptime: {Math.floor(healthData.uptime / 60 / 60)} hours,{' '}
          {Math.floor((healthData.uptime / 60) % 60)} minutes
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* System Info */}
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-3 text-gray-800">
            System Resources
          </h2>
          <div className="space-y-3">
            <div className="text-gray-700">
              <span className="font-medium">Platform:</span>{' '}
              {healthData.system.platform}
            </div>
            <div className="text-gray-700">
              <span className="font-medium">CPU Usage:</span>{' '}
              {healthData.system.cpu_usage_percent}%
              <div className="mt-1 w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${
                    parseFloat(healthData.system.cpu_usage_percent) > 80
                      ? 'bg-red-500'
                      : parseFloat(healthData.system.cpu_usage_percent) > 60
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${healthData.system.cpu_usage_percent}%` }}
                ></div>
              </div>
            </div>
            <div className="text-gray-700">
              <span className="font-medium">Memory Usage:</span>{' '}
              {healthData.system.memory.usage_percent}%
              <div className="mt-1 w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${
                    parseFloat(healthData.system.memory.usage_percent) > 80
                      ? 'bg-red-500'
                      : parseFloat(healthData.system.memory.usage_percent) > 60
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{
                    width: `${healthData.system.memory.usage_percent}%`,
                  }}
                ></div>
              </div>
            </div>
            <div className="text-gray-700">
              <span className="font-medium">Total Memory:</span>{' '}
              {formatBytes(healthData.system.memory.total_bytes)}
            </div>
            <div className="text-gray-700">
              <span className="font-medium">Free Memory:</span>{' '}
              {formatBytes(healthData.system.memory.free_bytes)}
            </div>
          </div>
        </div>

        {/* Database Info */}
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-3 text-gray-800">
            Database Status
          </h2>
          <div
            className={`p-2 rounded-md border ${
              healthData.database.connected
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-red-50 border-red-200 text-red-700'
            } mb-3`}
          >
            <div className="flex items-center">
              <div
                className={`w-2.5 h-2.5 rounded-full mr-2 ${
                  healthData.database.connected ? 'bg-green-500' : 'bg-red-500'
                }`}
              ></div>
              Status: {healthData.database.status}
            </div>
          </div>

          {healthData.database.connected && healthData.database.stats && (
            <div className="space-y-3">
              <div className="text-gray-700">
                <span className="font-medium">Connections:</span>{' '}
                {healthData.database.stats.connections?.current} /{' '}
                {healthData.database.stats.connections?.available}
              </div>
              {healthData.database.stats.opcounters && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-gray-50 rounded border border-gray-200 text-gray-700">
                    Inserts: {healthData.database.stats.opcounters.insert}
                  </div>
                  <div className="p-2 bg-gray-50 rounded border border-gray-200 text-gray-700">
                    Queries: {healthData.database.stats.opcounters.query}
                  </div>
                  <div className="p-2 bg-gray-50 rounded border border-gray-200 text-gray-700">
                    Updates: {healthData.database.stats.opcounters.update}
                  </div>
                  <div className="p-2 bg-gray-50 rounded border border-gray-200 text-gray-700">
                    Deletes: {healthData.database.stats.opcounters.delete}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Process Info */}
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-3 text-gray-800">
          Process Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-500">PID</div>
            <div className="text-lg font-semibold text-gray-800">
              {healthData.process.pid}
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-500">Node Version</div>
            <div className="text-lg font-semibold text-gray-800">
              {healthData.process.version}
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-500">Heap Used</div>
            <div className="text-lg font-semibold text-gray-800">
              {formatBytes(healthData.process.memory_usage.heapUsed)}
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-500">Active Connections</div>
            <div className="text-lg font-semibold text-gray-800">
              {healthData.active_connections}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
