import express from 'express';
import { checkPermission, protect } from '../auth/auth.middleware';
import {
  createGlobalRole,
  createOrganizationRole,
  deleteRole,
  getGlobalRoles,
  getOrganizationRoles,
  getRoleById,
  getRolePermissions,
} from './role.controller';
import { standardApiLimiter } from '../../utils/rateLimiter';

const router = express.Router({ mergeParams: true });



// Get all roles for an organization
router.get(
  
  '/organizations/:organizationId/roles',
 

  standardApiLimiter,
  protect,
  checkPermission('view_roles'),
  getOrganizationRoles,
);

// Create global role
router.post(
  '/global',
  standardApiLimiter,
  protect,
  checkPermission('manage_user_global_roles'),
  createGlobalRole,
);

// Create organization role
router.post(
  '/organization',
  standardApiLimiter,
  protect,
  checkPermission('manage_organization_roles'),
  createOrganizationRole,
);
// Get all global roles
router.get(
  '/global',
  standardApiLimiter,
  protect,
  checkPermission('view_roles'),
  getGlobalRoles,
);

// Get role by ID
router.get(
  '/:roleId',
  standardApiLimiter,
  protect,
  checkPermission('manage_user_global_roles'),
  getRoleById,
);

// Get role permissions
router.get(
  '/:roleId/permissions',
  standardApiLimiter,
  protect,
  checkPermission('view_permissions'),
  getRolePermissions,
);

// Delete role
router.delete(
  '/:roleId',
  standardApiLimiter,
  protect,
  checkPermission('manage_user_global_roles'),
  deleteRole,
);
export default router;
