import { NextFunction, Request, Response } from 'express';
import asyncHandler from '../../shared/middleware/async';
import ErrorResponse from '../../utils/errorResponse';
import { IOrganization } from './organization.model';
import { organizationService } from './organization.service';
import { AuthRequest } from '../auth/auth.middleware';
import mongoose from 'mongoose';

interface CreateOrganizationBody {
  name: string;
  facilities: string[];
  location: {
    place_id: string;
    address: string;
    coordinates: {
      type: 'Point';
      coordinates: [number, number];
    };
    area?: string;
    sub_area?: string;
    city: string;
    post_code?: string;
  };
}

interface AssignOwnerBody {
  userId: string;
}
// Interface for Update Organization Body
interface UpdateOrganizationBody
  extends Omit<Partial<CreateOrganizationBody>, 'facilities'> {
  facilities?: string | string[];
  imagesToKeep?: string[];
}

// Interface for Create Role Body
interface CreateRoleBody {
  roleName: string;
  permissions: string[]; // Array of permission names
}

// Interface for Assign Role Body
interface AssignRoleBody {
  roleId: string;
}

/**
 * @route   POST /api/v1/organizations
 * @desc    Create a new organization
 * @access  Private (Admin only)
 */
export const createOrganization = asyncHandler(
  async (
    req: AuthRequest & { body: CreateOrganizationBody },
    res: Response,
    next: NextFunction,
  ) => {
    const { name, facilities } = req.body;

    let parsedFacilities: IOrganization['facilities'];

    // Parse facilities (if sent as a JSON string)
    try {
      parsedFacilities =
        typeof facilities === 'string' ? JSON.parse(facilities) : facilities;
    } catch (error) {
      return next(new ErrorResponse('Invalid facilities format', 400));
    }

    // parse and validate location
    let location: IOrganization['location'];
    try {
      const parsedLocation =
        typeof req.body.location === 'string'
          ? JSON.parse(req.body.location)
          : req.body.location;

      // Validate location structure
      if (
        !parsedLocation?.place_id ||
        !parsedLocation?.address ||
        !parsedLocation?.coordinates?.type ||
        !parsedLocation?.coordinates?.coordinates ||
        !parsedLocation?.city
      ) {
        throw new Error('Invalid location structure');
      }

      location = parsedLocation;
    } catch (error) {
      return next(
        new ErrorResponse('Invalid location format or structure', 400),
      );
    }
    const images = req.files as Express.Multer.File[];

    // Check if user is authenticated
    if (!req.user) {
      return next(new ErrorResponse('User not authenticated', 401));
    }

    // Input validation
    if (!name || !parsedFacilities || !location) {
      return next(
        new ErrorResponse('All fields except images are required', 400),
      );
    }

    // Create organization with owner
    const organization = await organizationService.createOrganization(
      name,
      parsedFacilities,
     
      location,
      images
      
    );

    res.status(201).json({
      success: true,
      data: organization,
      message: 'Organization created successfully',
    });
  },
);
/**
 * @route   POST /api/v1/organizations/:id/assign-owner
 * @desc    Assign a user as the owner of an organization
 * @access  Private (Requires 'assign_organization_owner' permission)
 */
export const assignOwner = asyncHandler(
  async (req: AuthRequest & { params: { id: string }, body: AssignOwnerBody }, res: Response, next: NextFunction) => {
      const { id: organizationId } = req.params;
      console.log(organizationId)
      const { userId } = req.body;

      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
          return next(new ErrorResponse("Valid User ID is required in the request body", 400));
      }
       if (!mongoose.Types.ObjectId.isValid(organizationId)) {
          return next(new ErrorResponse("Invalid Organization ID", 400));
      }

      const updatedOrganization = await organizationService.assignOwnerToOrganization(organizationId, userId);

      res.status(200).json({
          success: true,
          data: updatedOrganization,
          message: `User ${userId} assigned as owner successfully`,
      });
  }
);

/**
 * @route   PUT /api/v1/organizations/:id
 * @desc    Update an organization
 * @access  Private (Admin only)
 */
export const updateOrganization = asyncHandler(
  async (
    req: AuthRequest & { params: { id: string }, body: UpdateOrganizationBody },
    res: Response,
    next: NextFunction,
  ) => {
    const { id } = req.params;
    const { name, facilities, location, ...rest } = req.body;

    const newImages = req.files as Express.Multer.File[];

    const updateData: Partial<IOrganization> = {
      ...(name && { name }),
      ...(facilities && {
        facilities:
          typeof facilities === 'string' ? JSON.parse(facilities) : facilities,
      }),
    };

    if (location) {
      updateData.location =
        typeof location === 'string' ? JSON.parse(location) : location;
    }

    Object.assign(updateData, rest);

    const organization = await organizationService.updateOrganization(
      id,
      updateData,
      newImages,
    );

    if (!organization) {
      return next(new ErrorResponse('Organization not found', 404));
    }

    res.status(200).json({
      success: true,
      data: organization,
      message: 'Organization updated successfully',
    });
  },
);

/**
 * @route   DELETE /api/v1/organizations/:id
 * @desc    Delete an organization
 * @access  Private (Admin only)
 */
export const deleteOrganization = asyncHandler(
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const result = await organizationService.deleteOrganization(id);

    if (result.deletedCount === 0) {
      return next(new ErrorResponse('Organization not found', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Organization deleted successfully',
    });
  },
);
/**
 * @route   POST /api/v1/organizations/:id/roles
 * @desc    Create a new role within an organization
 * @access  Private (Requires 'manage_organization_roles' permission for this organization)
 */
export const createOrganizationRole = asyncHandler(
    async (req: AuthRequest & { params: { id: string }, body: CreateRoleBody }, res: Response, next: NextFunction) => {
        const { id: organizationId } = req.params;
        const { roleName, permissions } = req.body;

        if (!roleName || !permissions || !Array.isArray(permissions) || permissions.length === 0) {
            return next(new ErrorResponse("Role name and a non-empty array of permission names are required", 400));
        }
        if (!mongoose.Types.ObjectId.isValid(organizationId)) {
            return next(new ErrorResponse("Invalid Organization ID", 400));
        }


        const newRole = await organizationService.createOrganizationRole(organizationId, roleName, permissions);

        res.status(201).json({
            success: true,
            data: newRole,
            message: `Role '${roleName}' created successfully for organization ${organizationId}`,
        });
    })
/**
 * @route   POST /api/v1/organizations/:organizationId/users/:userId/assign-role
 * @desc    Assign an existing organization role to a user
 * @access  Private (Requires 'assign_organization_roles' permission for this organization)
 */
export const assignOrganizationRoleToUser = asyncHandler(
  async (req: AuthRequest & { params: { organizationId: string, userId: string }, body: AssignRoleBody }, res: Response, next: NextFunction) => {
      const { organizationId, userId } = req.params;
      const { roleId } = req.body;

       if (!mongoose.Types.ObjectId.isValid(organizationId) || !mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(roleId) ) {
          return next(new ErrorResponse("Invalid Organization ID, User ID, or Role ID", 400));
      }
       if (!roleId) {
          return next(new ErrorResponse("Role ID is required in the request body", 400));
      }


      const updatedUser = await organizationService.assignRoleToUser(organizationId, userId, roleId);

      res.status(200).json({
          success: true,
          // Decide what to return: updated user, or just success message
          // data: updatedUser,
          message: `Role assigned successfully to user ${userId} in organization ${organizationId}`,
      });
  }
);