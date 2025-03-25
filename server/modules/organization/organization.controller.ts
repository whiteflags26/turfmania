import { NextFunction, Request, Response } from "express";
import asyncHandler from "../../shared/middleware/async";
import ErrorResponse from "../../utils/errorResponse";
import { IOrganization } from "./organization.model";
import { organizationService } from "./organization.service";
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
      type: "Point";
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
    next: NextFunction
  ) => {
    const { name, facilities } = req.body;

    let parsedFacilities: IOrganization["facilities"];

    // Parse facilities (if sent as a JSON string)
    try {
      parsedFacilities =
        typeof facilities === "string" ? JSON.parse(facilities) : facilities;
    } catch (error) {
      return next(new ErrorResponse("Invalid facilities format", 400));
    }

    // parse and validate location
    let location: IOrganization["location"];
    try {
      const parsedLocation =
        typeof req.body.location === "string"
          ? JSON.parse(req.body.location)
          : req.body.location;

      // Validate location structure
      if (
        !parsedLocation.place_id ||
        !parsedLocation.address ||
        !parsedLocation.coordinates ||
        !parsedLocation.coordinates.type ||
        !parsedLocation.coordinates.coordinates ||
        !parsedLocation.city
      ) {
        throw new Error("Invalid location structure");
      }

      location = parsedLocation;
    } catch (error) {
      return next(
        new ErrorResponse("Invalid location format or structure", 400)
      );
    }
    const images = req.files as Express.Multer.File[];

    // Check if user is authenticated
    if (!req.user) {
      return next(new ErrorResponse("User not authenticated", 401));
    }

    // Input validation
    if (!name || !parsedFacilities || !location) {
      return next(
        new ErrorResponse("All fields except images are required", 400)
      );
    }

    // Create organization with owner
    const organization = await organizationService.createOrganization(
      name,
      parsedFacilities,
      images,
      location,
      req.user.id // Pass the user ID
    );

    res.status(201).json({
      success: true,
      data: organization,
      message: "Organization created successfully",
    });
  }
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
    next: NextFunction
  ) => {
    const { id } = req.params;
    const { name, facilities, location, ...rest } = req.body;

    const newImages = req.files as Express.Multer.File[];

    const updateData: Partial<IOrganization> = {
      ...(name && { name }),
      ...(facilities && {
        facilities:
          typeof facilities === "string" ? JSON.parse(facilities) : facilities,
      }),
    };

    if (location) {
      updateData.location =
        typeof location === "string" ? JSON.parse(location) : location;
    }

    Object.assign(updateData, rest);

    const organization = await organizationService.updateOrganization(
      id,
      updateData,
      newImages
    );

    if (!organization) {
      return next(new ErrorResponse("Organization not found", 404));
    }

    res.status(200).json({
      success: true,
      data: organization,
      message: "Organization updated successfully",
    });
  }
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
      return next(new ErrorResponse("Organization not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Organization deleted successfully",
    });
  }
);

/**
 * @route   PUT /api/v1/organizations/:id
 * @desc    Add an user to organization
 * @access  Private (Admin only)
 */
export const addUserToOrganization = asyncHandler(
  async (
    req: AuthenticatedRequest &
      Request<{ organizationid: string; userId: string }>,
    res: Response,
    next: NextFunction
  ) => {
    const { id } = req.params;

    if (!req.user) {
      return next(new ErrorResponse("User not authenticated", 401));
    }
    const { role, userId } = req.body;

    const organization = await organizationService.addUserToTurf(
      userId,
      role,
      id
    );

    if (!organization) {
      return next(new ErrorResponse("Organization not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Added user to organization successfully",
    });
  }
);

export const updateOrganizationPermissions = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { permissions } = req.body;
    const { id } = req.params;

    // Check if user is authenticated
    if (!req.user) {
      return next(new ErrorResponse("User not authenticated", 401));
    }

    // Input validation
    if (!permissions || typeof permissions !== "object") {
      return next(
        new ErrorResponse("Please provide valid permissions object", 400)
      );
    }

    const updatedOrganization =
      await organizationService.updateOrganizationPermissions(
        id,
        req.user.id,
        permissions
      );

    res.status(200).json({
      success: true,
      data: updatedOrganization?.permissions,
      message: "Organization permissions updated successfully",
    });
  }
);
