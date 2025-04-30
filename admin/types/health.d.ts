import { Request } from 'express';

// Health Data Response
export interface HealthDataResponse {
  status: string;
  timestamp: Date;
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
    memory_usage: NodeJS.MemoryUsage;
    version: string;
  };
  database: {
    connected: boolean;
    status: string;
    stats: any;
  };
  active_connections: number;
}

// Prometheus Metrics Response (raw string)
export type PrometheusMetricsResponse = string;

// Latest Metrics Response
export interface LatestMetricsResponse {
  success: boolean;
  metrics: any; // You can use IHealthMetrics if you want strict typing
}

// Metrics History Options
export interface MetricsHistoryOptions {
  hours?: number;
  interval?: 'minute' | 'hour' | 'day';
}

// Metrics History Response
export interface MetricsHistoryResponse {
  success: boolean;
  metrics: Array<{
    _id: any;
    timestamp: Date;
    cpuUsage: number;
    memoryUsage: number;
    activeConnections: number;
    dbConnections: number;
  }>;
}

// Controller Service Methods
export interface IHealthService {
  getHealthData(): Promise<HealthDataResponse>;
  getPrometheusMetrics(): Promise<PrometheusMetricsResponse>;
  getPrometheusContentType(): string;
  getLatestMetrics(): Promise<any>;
  getMetricsHistory(options: MetricsHistoryOptions): Promise<any>;
  collectAndStoreMetrics(): Promise<any>;
  cleanupOldMetrics(cutoffDate: Date): Promise<void>;
}

// Controller Request Types
export interface BasicHealthCheckRequest extends Request {}
export interface DetailedHealthCheckRequest extends Request {}
export interface PrometheusMetricsRequest extends Request {}
export interface LatestMetricsRequest extends Request {}
export interface MetricsHistoryRequest extends Request {
  query: {
    hours?: string;
    interval?: 'minute' | 'hour' | 'day';
  };
}
