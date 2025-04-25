import express from 'express';
import { getUserById, getUsers } from './user.controller';
import { protect } from '../auth/auth.middleware';

const router = express.Router({ mergeParams: true });

// Get all users
router.get(
  '/',
  protect,
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
