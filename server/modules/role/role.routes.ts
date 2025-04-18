import express from 'express';
import { checkPermission, protect } from '../auth/auth.middleware';
import {
  createGlobalRole,
  createOrganizationRole,
  getGlobalRoles,
  getOrganizationRoles,
} from './role.controller';

const router = express.Router({ mergeParams: true });

router.use(protect);

// Get all roles for an organization
router.get(
  '/organizations/:organizationId/roles',
  checkPermission('view_roles'),
  getOrganizationRoles,
);

// Create global role
router.post(
  '/global',
  protect,
  checkPermission('manage_user_global_roles'),
  createGlobalRole,
);

// Create organization role
router.post(
  '/organization',
  protect,
  checkPermission('manage_organization_roles'),
  createOrganizationRole,
);
// Get all global roles
router.get(
  '/global',
  // checkPermission('view_global_roles'),
  getGlobalRoles
);
export default router;
