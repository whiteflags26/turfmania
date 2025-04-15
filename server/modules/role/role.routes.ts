import express from 'express';
import { checkPermission, protect } from '../auth/auth.middleware';
import { getOrganizationRoles } from './role.controller';

const router = express.Router({ mergeParams: true }); 


router.use(protect);

// Get all roles for an organization
router.get(
  '/organizations/:organizationId/roles',
  checkPermission('view_organization_roles'),
  getOrganizationRoles,
);

export default router;
