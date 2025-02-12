import express from 'express';
import {
  authorize,
  authorizeTurfRoles,
  protect,
} from '../auth/auth.middleware';
import {
  addUserToTurf,
  createTurf,
  updateTurf,
  updateTurfPermissions,
} from './turf.controller';

const router = express.Router();

router.route('/').post(protect, authorize('owner'), createTurf);

router.route('/:id').put(protect, authorizeTurfRoles('update'), updateTurf);

router
  .route('/:id/assign')
  .put(protect, authorizeTurfRoles('roleManage'), addUserToTurf);

router.put(
  '/:id/permissions',
  protect,
  authorizeTurfRoles('roleManage'), // Only owners can modify permissions
  updateTurfPermissions,
);

export default router;
