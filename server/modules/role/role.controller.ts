import { NextFunction, Response } from 'express';
import mongoose from 'mongoose';
import asyncHandler from '../../shared/middleware/async';
import ErrorResponse from '../../utils/errorResponse';
import { AuthRequest } from '../auth/auth.middleware';
import { roleService } from './role.service';

interface UpdateRoleBody {
  name?: string;
  permissions?: string[]; // Array of permission IDs
}

/**
 * @route   GET /api/v1/organizations/:organizationId/roles
 * @desc    Get all roles in an organization
 * @access  Private (Requires 'view_organization_roles' permission)
 */
export const getOrganizationRoles = asyncHandler(
  async (
    req: AuthRequest & { params: { organizationId: string } },
    res: Response,
    next: NextFunction,
  ) => {
    const { organizationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      return next(new ErrorResponse('Invalid Organization ID', 400));
    }

    const roles = await roleService.getRolesByOrganization(organizationId);

    res.status(200).json({
      success: true,
      count: roles.length,
      data: roles,
    });
  },
);

/**
 * @route   PUT /api/v1/organizations/:organizationId/roles/:roleId
 * @desc    Update a role in an organization
 * @access  Private (Requires 'manage_organization_roles' permission)
 */
export const updateOrganizationRole = asyncHandler(
  async (
    req: AuthRequest & {
      params: { organizationId: string; roleId: string };
      body: UpdateRoleBody;
    },
    res: Response,
    next: NextFunction,
  ) => {
    const { organizationId, roleId } = req.params;
    const updateData = req.body;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      return next(new ErrorResponse('Invalid Organization ID', 400));
    }
    if (!mongoose.Types.ObjectId.isValid(roleId)) {
      return next(new ErrorResponse('Invalid Role ID', 400));
    }

    // Validate update data
    if (!updateData.name && !updateData.permissions?.length) {
      return next(new ErrorResponse('No valid update data provided', 400));
    }

    const updatedRole = await roleService.updateOrganizationRole(
      organizationId,
      roleId,
      updateData,
    );

    res.status(200).json({
      success: true,
      data: updatedRole,
      message: 'Role updated successfully',
    });
  },
);
