// organization-request.controller.ts (Updated)
import { NextFunction, Request, Response } from "express";
import validator from "validator";
import asyncHandler from "../../shared/middleware/async";
import ErrorResponse from "../../utils/errorResponse";
import { AuthRequest } from "../auth/auth.middleware";
import OrganizationRequestService from "./organization-request.service";

export default class OrganizationRequestController {
  private readonly organizationRequestService: OrganizationRequestService;

  constructor() {
    this.organizationRequestService = new OrganizationRequestService();
  }

  /**
   * @route   POST /api/v1/organization-requests
   * @desc    Create a new organization request
   * @access  Private
   */
  public createOrganizationRequest = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw new ErrorResponse("User not authenticated", 401);
      }

      // Basic validation
      const {
        organizationName,
        facilities,
        location,
        contactPhone,
        ownerEmail,
        requestNotes,
      } = req.body;
      // Validate required fields
      if (
        !organizationName ||
        !facilities ||
        !location ||
        !contactPhone ||
        !ownerEmail
      ) {
        throw new ErrorResponse("Missing required fields", 400);
      }

      // Sanitize and validate email field
      const sanitizedOwnerEmail = validator
        .trim(ownerEmail || "")
        .toLowerCase();

      // Validate email format
      if (!validator.isEmail(sanitizedOwnerEmail)) {
        throw new ErrorResponse("Invalid owner email format", 400);
      }

      // Process facilities if it's a string
      let parsedFacilities: string[];
      try {
        parsedFacilities =
          typeof facilities === "string" ? JSON.parse(facilities) : facilities;
        if (!Array.isArray(parsedFacilities) || parsedFacilities.length === 0) {
          throw new ErrorResponse("Facilities must be a non-empty array", 400);
        }
      } catch (error) {
        throw new ErrorResponse("Invalid facilities format", 400);
      }

      // Process location if it's a string
      let parsedLocation: any;
      try {
        parsedLocation =
          typeof location === "string" ? JSON.parse(location) : location;

        // Validate required location fields
        if (
          !parsedLocation.place_id ||
          !parsedLocation.address ||
          !parsedLocation.coordinates ||
          !parsedLocation.city
        ) {
          throw new ErrorResponse("Location missing required fields", 400);
        }
      } catch (error) {
        throw new ErrorResponse("Invalid location format", 400);
      }

      // Handle file uploads
      const images = (req.files as Express.Multer.File[]) || [];

      const request = await this.organizationRequestService.createRequest(
        req.user.id,
        {
          organizationName: validator.trim(organizationName),
          facilities: parsedFacilities,
          location: parsedLocation,
          contactPhone: validator.trim(contactPhone),
          ownerEmail: sanitizedOwnerEmail,
          requestNotes: requestNotes ? validator.trim(requestNotes) : undefined,
        },
        images
      );

      res.status(201).json({
        success: true,
        data: request,
        message: "Organization request submitted successfully",
      });
    }
  );

  /**
   * @route   GET /api/v1/organization-requests/validate-owner-email/:email
   * @desc    Validate if owner email exists in database
   * @access  Private (Admin only)
   */
  public validateOwnerEmail = asyncHandler(
    async (req: Request, res: Response) => {
      const { email } = req.params;

      if (!email) {
        throw new ErrorResponse("Email parameter is required", 400);
      }

      const isValid = await this.organizationRequestService.validateOwnerEmail(
        email
      );

      res.status(200).json({
        success: true,
        data: { exists: isValid },
      });
    }
  );

  /**
   * @route   PUT /api/v1/organization-requests/:id/process
   * @desc    Start processing an organization request
   * @access  Private (Admin only)
   */
  public startProcessingRequest = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      if (!req.user) {
        throw new ErrorResponse("User not authenticated", 401);
      }

      const { id } = req.params;
      const request = await this.organizationRequestService.startProcessing(
        id,
        req.user.id
      );

      res.status(200).json({
        success: true,
        data: request,
        message: "Request processing started",
      });
    }
  );

  /**
   * @route   PUT /api/v1/organization-requests/:id/cancel-processing
   * @desc    Cancel processing an organization request
   * @access  Private (Admin only)
   */
  public cancelProcessingRequest = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      if (!req.user) {
        throw new ErrorResponse("User not authenticated", 401);
      }

      const { id } = req.params;
      const request = await this.organizationRequestService.cancelProcessing(
        id,
        req.user.id
      );

      res.status(200).json({
        success: true,
        data: request,
        message: "Request processing cancelled",
      });
    }
  );

  /**
   * @route   PUT /api/v1/organization-requests/:id/reject
   * @desc    Reject an organization request
   * @access  Private (Admin only)
   */
  public rejectOrganizationRequest = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      if (!req.user) {
        throw new ErrorResponse("User not authenticated", 401);
      }

      const { id } = req.params;
      const { adminNotes } = req.body;

      if (!adminNotes) {
        throw new ErrorResponse("Rejection reason is required", 400);
      }

      const request = await this.organizationRequestService.rejectRequest(
        id,
        req.user.id,
        validator.trim(adminNotes)
      );

      res.status(200).json({
        success: true,
        data: request,
        message: "Organization request rejected",
      });
    }
  );

  /**
   * @route   GET /api/v1/organization-requests/my/:id
   * @desc    Get requester's own organization request by ID
   * @access  Private (Requester only)
   */
  public getMyOrganizationRequest = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      if (!req.user) {
        throw new ErrorResponse("User not authenticated", 401);
      }

      const { id } = req.params;
      const request = await this.organizationRequestService.getRequestById(id);

      if (!request.requesterId.equals(req.user.id)) {
        throw new ErrorResponse("Not authorized to view this request", 403);
      }

      res.status(200).json({
        success: true,
        data: request,
      });
    }
  );

  /**
   * @route   GET /api/v1/organization-requests/admin/:id
   * @desc    Get any organization request (admin access)
   * @access  Private (Admin only)
   */
  public getOrganizationRequestAsAdmin = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      if (!req.user) {
        throw new ErrorResponse("User not authenticated", 401);
      }

      const { id } = req.params;
      const request = await this.organizationRequestService.getRequestById(id);

      res.status(200).json({
        success: true,
        data: request,
      });
    }
  );
}
