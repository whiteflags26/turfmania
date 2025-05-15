import api from '@/lib/axios';

// Types that mirror backend structures
export interface SystemHealth {
  status: 'ok' | 'database_error' | string;
  timestamp: string;
  uptime: number;
  system: {
    hostname: string;
    platform: string;
    cpus: number;
    load_average: number[];
    cpu_usage_percent: string;
    memory: {
      total_bytes: number;
      free_bytes: number;
      used_bytes: number;
      usage_percent: string;
    };
  };
  process: {
    pid: number;
    memory_usage: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
    version: string;
  };
  database: {
    connected: boolean;
    status: 'connected' | 'disconnected';
    stats: {
      connections?: {
        current: number;
        available: number;
        pending: number;
      };
      uptime?: number;
      opcounters?: {
        insert: number;
        query: number;
        update: number;
        delete: number;
      };
    } | null;
  };
  active_connections: number;
}

export interface MetricsData {
  timestamp: string;
  system: {
    cpuUsage: number;
    totalMemory: number;
    freeMemory: number;
    memoryUsagePercent: number;
    loadAverage: number[];
  };
  process: {
    uptime: number;
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  database: {
    connected: boolean;
    connections: {
      current: number;
      available: number;
      pending: number;
    };
    opcounters: {
      insert: number;
      query: number;
      update: number;
      delete: number;
    };
  };
  activeConnections: number;
}

export interface MetricsHistoryData {
  _id: {
    year: number;
    month: number;
    day: number;
    hour?: number;
    minute?: number;
  };
  timestamp: string;
  cpuUsage: number;
  memoryUsage: number;
  activeConnections: number;
  dbConnections: number;
}

export interface MetricsHistoryOptions {
  hours?: number;
  interval?: 'minute' | 'hour' | 'day';
}

// Service functions - Fixed to match backend routes
export async function getHealthData(): Promise<SystemHealth> {
  try {
    // Use direct fetch instead of axios for the /health endpoint
    const response = await fetch('/health', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        // Include auth token if needed for protected routes
        ...(typeof window !== 'undefined' && localStorage.getItem('admin_token') 
          ? { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
          : {})
      }
    });

    if (!response.ok) {
      throw new Error(`Health check failed with status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Failed to fetch health data:', error);
    throw new Error(
      error.message ?? 'Failed to fetch health data'
    );
  }
}

export async function getMetricsData(): Promise<MetricsData> {
  try {
    const { data } = await api.get('/v1/metrics/latest');
    return data.metrics; // Adjust to extract data.metrics based on your controller response
  } catch (error: any) {
    console.error('Failed to fetch latest metrics:', error);
    throw new Error(
      error.response?.data?.message ?? 'Failed to fetch latest metrics',
    );
  }
}

export async function getMetricsHistory(
  options: MetricsHistoryOptions = {},
): Promise<MetricsHistoryData[]> {
  try {
    const { data } = await api.get('/v1/metrics/history', {
      params: options,
    });
    return data.metrics; // Adjust to extract data.metrics based on your controller response
  } catch (error: any) {
    console.error('Failed to fetch metrics history:', error);
    throw new Error(
      error.response?.data?.message ?? 'Failed to fetch metrics history',
    );
  }
}

export async function getPrometheusMetrics(): Promise<string> {
  try {
    const response = await fetch(
      '/metrics',
      {
        method: 'GET',
        credentials: 'include',
        headers: {
          // Include auth token if needed for protected routes
          ...(typeof window !== 'undefined' && localStorage.getItem('admin_token') 
            ? { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
            : {})
        }
      },
    );

    if (!response.ok) {
      throw new Error('Failed to fetch Prometheus metrics');
    }

    return await response.text();
  } catch (error: any) {
    console.error('Failed to fetch Prometheus metrics:', error);
    throw new Error(error.message ?? 'Failed to fetch Prometheus metrics');
  }
}

// Example function to clean up old metrics (admin function)
export async function cleanupOldMetrics(days: number): Promise<void> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    await api.delete('/v1/metrics/cleanup', {
      params: { cutoffDate: cutoffDate.toISOString() },
    });
  } catch (error: any) {
    console.error('Failed to cleanup old metrics:', error);
    throw new Error(
      error.response?.data?.message ?? 'Failed to cleanup old metrics',
    );
  }
}
