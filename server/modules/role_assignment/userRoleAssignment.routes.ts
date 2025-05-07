import express from 'express';
import { checkPermission, protect } from '../auth/auth.middleware';
import {
  assignGlobalRole,
  assignOrganizationRole,
} from './userRoleAssignmentController';
import { standardApiLimiter } from '../../utils/rateLimiter';

const router = express.Router();

// Protect all routes
router.use(protect);

// Global role assignment
router.post(
  '/users/:userId/assignments/global',
  
  checkPermission('manage_user_global_roles'),
  assignGlobalRole,
);

// Organization role assignment
router.post(
  '/organizations/:organizationId/users/:userId/assignments',
  
  checkPermission('manage_organization_roles'),
  assignOrganizationRole,
);

export default router;
