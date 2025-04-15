import { NextFunction, Request, Response } from 'express';
import asyncHandler from '../../shared/middleware/async';
import ErrorResponse from '../../utils/errorResponse';
import { AuthRequest } from '../auth/auth.middleware';
import mongoose from 'mongoose';
import Role from '../role/role.model';
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
  async (req: AuthRequest & { params: { organizationId: string } }, res: Response, next: NextFunction) => {
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
  }
);