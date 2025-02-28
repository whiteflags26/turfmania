import { NextFunction, Request, Response } from "express";
import asyncHandler from "../../shared/middleware/async";
import ErrorResponse from "../../utils/errorResponse";
import { organizationService } from "./organization.service";

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
    req: Request<{}, {}, CreateOrganizationBody>,
    res: Response,
    next: NextFunction
  ) => {
    const { name, facilities, location } = req.body;
    const images = req.files as Express.Multer.File[]; // Assuming Multer middleware is used

    // Input validation
    if (!name || !facilities || !location || !images?.length) {
      return next(new ErrorResponse("All fields are required", 400));
    }

    // Create organization
    const organization = await organizationService.createOrganization(
      name,
      facilities,
      images,
      location
    );

    res.status(201).json({
      success: true,
      data: organization,
      message: "Organization created successfully",
    });
  }
);
