// src/modules/health/health.routes.ts
import express from 'express';
import HealthController from '../health-metrics/health-metrics.controller';
import { checkPermission, protect } from "../auth/auth.middleware";

const router = express.Router();
const healthController = new HealthController();

// Health check routes
router.head('/', healthController.basicHealthCheck);
router.get('/', protect, checkPermission("get_health_check"), healthController.detailedHealthCheck); // global permission 

// Prometheus metrics endpoint
const metricsRouter = express.Router();
metricsRouter.get('/', protect, checkPermission("get_health_check"), healthController.getPrometheusMetrics);

// Metrics API endpoints
const metricsApiRouter = express.Router();
metricsApiRouter.get('/latest', healthController.getLatestMetrics);
metricsApiRouter.get('/history', healthController.getMetricsHistory);

export { router as healthRouter, metricsRouter, metricsApiRouter };