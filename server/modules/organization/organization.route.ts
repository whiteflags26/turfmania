import express from 'express';
import multer from 'multer';
import { protect } from '../auth/auth.middleware';
import {
  addUserToOrganization,
  createOrganization,
  deleteOrganization,
  updateOrganization,
  updateOrganizationPermissions,
} from './organization.controller';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 5 },
}); // Store files in memory for Cloudinary upload

// Create organization
router.post('/', protect, upload.array('images', 5), createOrganization); // Allow up to 5 images

// Update organization
router.put('/:id', upload.array('images', 5), updateOrganization);
router.put('/:id/add_user', protect, addUserToOrganization);
// Update organization permissions
router.put('/:id/permissions', protect, updateOrganizationPermissions);
// Delete organization
router.delete('/:id', deleteOrganization);

export default router;
