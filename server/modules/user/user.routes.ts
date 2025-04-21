import express from 'express';
import { protect } from '../auth/auth.middleware';
import { getUserById, getUsers } from './user.controller';

const router = express.Router({ mergeParams: true });

// Apply protection middleware to all routes
router.use(protect);

// Get all users
router.get(
  '/',
  //   checkPermission('view_users'),
  getUsers,
);

// Get user by ID
router.get(
  '/:userId',
  //   checkPermission('view_users'),
  getUserById,
);

export default router;
