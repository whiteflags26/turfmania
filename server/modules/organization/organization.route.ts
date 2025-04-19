import express from 'express';
import multer from 'multer';

import {
  checkPermission,
  logAdminAction,
  protect,
} from '../auth/auth.middleware';

import { getOrganizationRoles } from '../role/role.controller';
import { assignOrganizationRole } from '../role_assignment/userRoleAssignmentController';
import {
  assignOrganizationRoleToUser,
  assignOwner,
  createOrganization,
  createOrganizationRole,
  deleteOrganization,
  updateOrganization,
} from './organization.controller';

const router = express.Router();

// Configure Multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 5 }, // 5MB limit, up to 5 files
});

// --- Organization CRUD ---

// Create Organization (Admin only)
router.post(
  '/',
  protect,
  checkPermission('create_organization'), // Global permission check
  logAdminAction('CREATE', 'Organization'),
  upload.array('images', 5), // Handle images
  createOrganization,
);

// Assign Owner to Organization (Admin only)
router.post(
  '/:id/assign-owner',
  protect,
  checkPermission('assign_organization_owner'), // Global permission check
  assignOwner,
);

// Update Organization Details (Org Owner or role with permission)
router.put(
  '/:id',
  protect,
  checkPermission('update_organization'), // Organization-scoped permission check
  upload.array('images', 5), // Handle optional image updates
  updateOrganization,
);

// Delete Organization (Org Owner or Admin)
router.delete(
  '/:id',
  protect,

  checkPermission('delete_own_organization'), // Check this first (most common case)

  deleteOrganization,
);

router.post(
  '/:id/roles', // Use :id for organizationId for consistency
  protect,
  checkPermission('manage_organization_roles'), // Organization-scoped
  createOrganizationRole,
);

// Assign a Role to a User within an Organization
router.post(
  '/:organizationId/users/:userId/assign-role',
  protect,
  checkPermission('assign_organization_roles'), // Organization-scoped
  assignOrganizationRoleToUser,
);
router.get(
  '/:organizationId/roles',
  protect,
  checkPermission('view_roles'),
  getOrganizationRoles,
);
router.post(
  '/:organizationId/users/:userId/assignments',
  protect,
  checkPermission('manage_organization_roles'),
  assignOrganizationRole,
);

export default router;
