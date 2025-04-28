import express from 'express';
import { protect } from '../auth/auth.middleware';
import {
  getAllPermissions,
  getGlobalPermissions,
  getLocalPermissions,
} from './permission.controller';
import { standardApiLimiter } from '../../utils/rateLimiter';

const router = express.Router();



// Get all permissions
router.get('/',standardApiLimiter,protect, getAllPermissions);

// Get global permissions
router.get('/global',standardApiLimiter,protect, getGlobalPermissions);

// Get local (organization) permissions
router.get('/local',standardApiLimiter,protect, getLocalPermissions);

export default router;
