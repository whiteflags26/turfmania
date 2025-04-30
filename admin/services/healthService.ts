import api from '@/lib/axios';
import {
  HealthDataResponse,
  LatestMetricsResponse,
  MetricsHistoryOptions,
  MetricsHistoryResponse,
  PrometheusMetricsResponse,
} from '@/types/health';

// Basic health check (HEAD /health)
export async function basicHealthCheck(): Promise<void> {
  await api.head('/health', { withCredentials: true });
}

// Detailed health check (GET /health)
export async function getDetailedHealth(): Promise<HealthDataResponse> {
  const { data } = await api.get<HealthDataResponse>('/health', {
    withCredentials: true,
  });
  return data;
}

// Prometheus metrics (GET /metrics)
export async function getPrometheusMetrics(): Promise<PrometheusMetricsResponse> {
  const { data } = await api.get<PrometheusMetricsResponse>('/metrics', {
    withCredentials: true,
    headers: { Accept: 'text/plain' },
  });
  return data;
}

// Latest metrics (GET /api/v1/metrics/latest)
export async function getLatestMetrics(): Promise<LatestMetricsResponse> {
  const { data } = await api.get<LatestMetricsResponse>(
    '/api/v1/metrics/latest',
    {
      withCredentials: true,
    },
  );
  return data;
}

// Metrics history (GET /api/v1/metrics/history)
export async function getMetricsHistory(
  options: MetricsHistoryOptions = {},
): Promise<MetricsHistoryResponse> {
  const { data } = await api.get<MetricsHistoryResponse>(
    '/api/v1/metrics/history',
    {
      params: options,
      withCredentials: true,
    },
  );
  return data;
}
