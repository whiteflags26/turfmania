import { NextFunction, Response } from 'express';
import asyncHandler from '../../shared/middleware/async';
import { AuthRequest } from '../auth/auth.middleware';
import { userService } from './user.service';

/**
 * @desc    Get all users
 * @route   GET /api/v1/users
 * @access  Private (Requires 'view_users' permission)
 */
export const getUsers = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const users = await userService.getAllUsers();

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  },
);

/**
 * @desc    Get user by ID
 * @route   GET /api/v1/users/:userId
 * @access  Private (Requires 'view_users' permission)
 */
export const getUserById = asyncHandler(
  async (
    req: AuthRequest & { params: { userId: string } },
    res: Response,
    next: NextFunction,
  ) => {
    const { userId } = req.params;
    const user = await userService.getUserById(userId);

    res.status(200).json({
      success: true,
      data: user,
    });
  },
);