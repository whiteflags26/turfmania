import { NextFunction, Response } from 'express';
import mongoose from 'mongoose';
import asyncHandler from '../../shared/middleware/async';
import ErrorResponse from '../../utils/errorResponse';
import { AuthRequest } from '../auth/auth.middleware';
import { PermissionScope } from '../permission/permission.model';
import { userRoleAssignmentService } from './userRoleAssignment.service';

interface AssignRoleBody {
  roleId: string;
}

/**
 * @desc    Assign a Global Role to a User
 * @route   POST /api/v1/users/:userId/assignments/global
 * @access  Private (Requires 'manage_user_global_roles' permission)
 */
export const assignGlobalRole = asyncHandler(
  async (
    req: AuthRequest & {
      params: { userId: string };
      body: AssignRoleBody;
    },
    res: Response,
    next: NextFunction,
  ) => {
    const { userId } = req.params;
    const { roleId } = req.body;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return next(new ErrorResponse('Invalid User ID', 400));
    }
    if (!mongoose.Types.ObjectId.isValid(roleId)) {
      return next(new ErrorResponse('Invalid Role ID', 400));
    }

    const assignment = await userRoleAssignmentService.assignRoleToUser(
      userId,
      roleId,
      PermissionScope.GLOBAL,
    );

    res.status(201).json({
      success: true,
      data: assignment,
      message: 'Global role assigned successfully',
    });
  },
);
