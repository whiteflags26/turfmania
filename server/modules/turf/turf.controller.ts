import { NextFunction, Request, Response } from 'express';
import asyncHandler from '../../shared/middleware/async';
import ErrorResponse from '../../utils/errorResponse';
import User from '../user/user.model';
import Turf from './turf.model';

import mongoose from 'mongoose';

// @desc   Create new turf
// @route  POST /api/v1/turf
// @access Private
export const createTurf = asyncHandler(
  async (
    req: Request & { user?: { id: string } },
    res: Response,
    next: NextFunction,
  ) => {
    const turfData = {
      ...req.body,
      owner: req.user?.id,
      userRoles: [
        {
          user: req.user?.id,
          role: 'owner' as const,
        },
      ],
      permissions: new Map([
        ['roleManage', ['owner']],
        ['update', ['owner']],
        ['delete', ['owner']],
      ]),
    };

    const turf = await Turf.create(turfData);

    res.status(201).json({
      success: true,
      data: turf,
    });
  },
);

// @desc   Create new turf
// @route  PUT /api/v1/turf
// @access Private
export const updateTurf = asyncHandler(
  async (
    req: Request & { user?: { id: string } },
    res: Response,
    next: NextFunction,
  ) => {
    const turf = await Turf.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!turf) {
      return next(
        new ErrorResponse(`response not found for id ${req.params.id}`, 404),
      );
    }

    res.status(200).json({
      success: true,
      data: turf,
    });
  },
);

// @desc Post adds an user in his turf with assigning a role
// @route POST/api/v1/turf/:id/assign
// @private

export const addUserToTurf = asyncHandler(
  async (
    req: Request & { user?: { id: string } },
    res: Response,
    next: NextFunction,
  ) => {
    const { userId, role } = req.body;

    if (!userId || !role) {
      next(new ErrorResponse('Please provide both userId and role', 400));
    }
    try {
      // First check if both user and bootcamp exist
      const [userToAdd, turf] = await Promise.all([
        User.findById(userId),
        Turf.findById(req.params.id),
      ]);
      if (!userToAdd) {
        return next(
          new ErrorResponse(`User with ID ${userId} was not found`, 404),
        );
      }

      if (!turf) {
        return next(
          new ErrorResponse(`Turf with ID ${req.params.id} was not found`, 404),
        );
      }
      // Check for existing role
      const existingRole = turf.userRoles.find(
        userRole => userRole.user.toString() === userId.toString(),
      );
      if (existingRole) {
        return next(
          new ErrorResponse(
            `User with ID ${userId} is already assigned to this turf with role: ${existingRole.role}`,
            400,
          ),
        );
      }
      // Instead of using save(), use findByIdAndUpdate
      const updatedTurf = await Turf.findByIdAndUpdate(
        req.params.id,
        {
          $push: {
            userRoles: { user: userId, role: role },
          },
        },
        {
          new: true,
          runValidators: true,
        },
      );
      if (!updatedTurf) {
        return next(new ErrorResponse('No turf found to update', 404));
      }

      res.status(200).json({
        success: true,
        data: updatedTurf.userRoles,
      });
    } catch (error: unknown) {
      console.error('Update Error:', error);

      if (error instanceof mongoose.Error.ValidationError) {
        return next(
          new ErrorResponse(`Validation Error: ${error.message}`, 400),
        );
      }

      if (error instanceof Error) {
        return next(new ErrorResponse(error.message, 500));
      }

      return next(new ErrorResponse('Server error', 500));
    }
  },
);

// @desc    Update turf permissions
// @route   PUT /api/v1/turf/:id/permissions
// @access  Private (Only owner)
export const updateTurfPermissions = asyncHandler(
  async (
    req: Request & { user?: { id: string } },
    res: Response,
    next: NextFunction,
  ) => {
    const { permissions } = req.body;
    const turfId = req.params.id;

    // Validate input
    if (!permissions || typeof permissions !== 'object') {
      return next(
        new ErrorResponse('Please provide valid permissions object', 400),
      );
    }

    try {
      // Find turf
      const turf = await Turf.findById(turfId);

      if (!turf) {
        return next(
          new ErrorResponse(`Turf not found with id of ${turfId}`, 404),
        );
      }

      // Verify ownership
      if (turf.owner.toString() !== req.user?.id) {
        return next(
          new ErrorResponse('Not authorized to update permissions', 401),
        );
      }

      // Convert permissions object to Map
      const permissionsMap = new Map<string, string[]>();

      // Validate and process each permission
      for (const [action, roles] of Object.entries(permissions)) {
        if (!Array.isArray(roles)) {
          return next(
            new ErrorResponse(`Roles for ${action} must be an array`, 400),
          );
        }

        // Validate roles
        const validRoles = roles.every(role =>
          ['owner', 'manager', 'stuff'].includes(role),
        );
        if (!validRoles) {
          return next(
            new ErrorResponse(
              'Invalid role specified. Roles must be either owner or editor',
              400,
            ),
          );
        }

        permissionsMap.set(action, roles);
      }

      // Update turf permissions
      const updatedTurf = await Turf.findByIdAndUpdate(
        turfId,
        { permissions: Object.fromEntries(permissionsMap) }, // Convert Map to plain object
        {
          new: true,
          runValidators: true,
        },
      ).select('permissions');

      if (!updatedTurf) {
        return next(new ErrorResponse('Turf update failed', 500));
      }

      res.status(200).json({
        success: true,
        data: updatedTurf.permissions,
      });
    } catch (error: unknown) {
      console.error('Permission Update Error:', error);

      if (error instanceof mongoose.Error.ValidationError) {
        return next(
          new ErrorResponse(`Validation Error: ${error.message}`, 400),
        );
      }

      if (error instanceof Error) {
        return next(new ErrorResponse(error.message, 500));
      }

      return next(new ErrorResponse('Server error', 500));
    }
  },
);
