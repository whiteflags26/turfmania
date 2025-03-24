import { NextFunction, Request, Response } from 'express';
import asyncHandler from '../../shared/middleware/async';
import ErrorResponse from '../../utils/errorResponse';
import { IOrganization } from './organization.model';
import { organizationService } from './organization.service';
interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

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

/**
 * @route   POST /api/v1/organizations
 * @desc    Create a new organization
 * @access  Private (Admin only)
 */
export const createOrganization = asyncHandler(
  async (
    req: AuthenticatedRequest & { body: CreateOrganizationBody },
    res: Response,
    next: NextFunction,
  ) => {
    const { name, facilities } = req.body;
    const location =
      typeof req.body.location === 'string'
        ? JSON.parse(req.body.location)
        : req.body.location;
    // const images = req.files as Express.Multer.File[];

    // Check if user is authenticated
    if (!req.user) {
      return next(new ErrorResponse('User not authenticated', 401));
    }
    console.log('user', req.user.id);

    // Input validation
    if (!name || !facilities || !location) {
      return next(
        new ErrorResponse('All fields except images are required', 400),
      );
    }

    // Create organization with owner
    const organization = await organizationService.createOrganization(
      name,
      facilities,
      // images,
      location,
      req.user.id, // Pass the user ID
    );

    res.status(201).json({
      success: true,
      data: organization,
      message: 'Organization created successfully',
    });
  },
);
interface UpdateOrganizationBody extends Partial<CreateOrganizationBody> {
  imagesToKeep?: string[];
}

/**
 * @route   PUT /api/v1/organizations/:id
 * @desc    Update an organization
 * @access  Private (Admin only)
 */
export const updateOrganization = asyncHandler(
  async (
    req: Request<{ id: string }, {}, UpdateOrganizationBody>,
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
 * @route   PUT /api/v1/organizations/:id
 * @desc    Add an user to organization
 * @access  Private (Admin only)
 */
export const addUserToTurf = asyncHandler(
  async (
    req: AuthenticatedRequest & Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    const { id } = req.params;
    if (!req.user) {
      return next(new ErrorResponse('User not authenticated', 401));
    }
    const role = req.body;

    const organization = await organizationService.addUserToTurf(
      req.user.id,
      role,
      id,
    );

    if (!organization) {
      return next(new ErrorResponse('Organization not found', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Added user to organization successfully',
    });
  },
);
