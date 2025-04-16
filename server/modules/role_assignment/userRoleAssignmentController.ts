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

/**
 * @desc    Assign an Organization Role to a User within that Org
 * @route   POST /api/v1/organizations/:organizationId/users/:userId/assignments
 * @access  Private (Requires 'manage_organization_roles' permission)
 */
export const assignOrganizationRole = asyncHandler(
  async (
    req: AuthRequest & {
      params: { organizationId: string; userId: string };
      body: AssignRoleBody;
    },
    res: Response,
    next: NextFunction,
  ) => {
    const { organizationId, userId } = req.params;
    const { roleId } = req.body;

    // Validate all IDs
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      return next(new ErrorResponse('Invalid Organization ID', 400));
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return next(new ErrorResponse('Invalid User ID', 400));
    }
    if (!mongoose.Types.ObjectId.isValid(roleId)) {
      return next(new ErrorResponse('Invalid Role ID', 400));
    }

    const assignment = await userRoleAssignmentService.assignRoleToUser(
      userId,
      roleId,
      PermissionScope.ORGANIZATION,
      organizationId,
    );

    res.status(201).json({
      success: true,
      data: assignment,
      message: 'Organization role assigned successfully',
    });
  },
);
