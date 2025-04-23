import { NextFunction, Request, Response } from 'express';
import validator from 'validator';
import asyncHandler from '../../shared/middleware/async';
import ErrorResponse from '../../utils/errorResponse';
import { AuthRequest } from '../auth/auth.middleware';
import OrganizationRequestService from './organization-request.service';

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
        throw new ErrorResponse('User not authenticated', 401);
      }

      // Basic validation
      const { name, facilities, location, contactName, contactPhone, contactEmail, ownerEmail, requestNotes } = req.body;

      // Validate required fields
      if (!name || !facilities || !location || !contactName || !contactPhone || !ownerEmail) {
        throw new ErrorResponse('Missing required fields', 400);
      }

      // Sanitize and validate email fields
      const sanitizedOwnerEmail = validator.trim(ownerEmail || '').toLowerCase();
      const sanitizedContactEmail = contactEmail ? validator.trim(contactEmail).toLowerCase() : undefined;

      // Validate email format
      if (!validator.isEmail(sanitizedOwnerEmail)) {
        throw new ErrorResponse('Invalid owner email format', 400);
      }

      if (sanitizedContactEmail && !validator.isEmail(sanitizedContactEmail)) {
        throw new ErrorResponse('Invalid contact email format', 400);
      }

      // Process facilities if it's a string
      let parsedFacilities: string[];
      try {
        parsedFacilities = typeof facilities === 'string' ? JSON.parse(facilities) : facilities;
        if (!Array.isArray(parsedFacilities) || parsedFacilities.length === 0) {
          throw new ErrorResponse('Facilities must be a non-empty array', 400);
        }
      } catch (error) {
        throw new ErrorResponse('Invalid facilities format', 400);
      }

      // Process location if it's a string
      let parsedLocation: any;
      try {
        parsedLocation = typeof location === 'string' ? JSON.parse(location) : location;
        
        // Validate required location fields
        if (!parsedLocation.place_id || !parsedLocation.address || 
            !parsedLocation.coordinates || !parsedLocation.city) {
          throw new ErrorResponse('Location missing required fields', 400);
        }
      } catch (error) {
        throw new ErrorResponse('Invalid location format', 400);
      }

      // Handle file uploads
      const images = req.files as Express.Multer.File[] || [];

      const request = await this.organizationRequestService.createRequest(
        req.user.id,
        {
          name: validator.trim(name),
          facilities: parsedFacilities,
          location: parsedLocation,
          contactName: validator.trim(contactName),
          contactPhone: validator.trim(contactPhone),
          contactEmail: sanitizedContactEmail,
          ownerEmail: sanitizedOwnerEmail,
          requestNotes: requestNotes ? validator.trim(requestNotes) : undefined
        },
        images
      );

      res.status(201).json({
        success: true,
        data: request,
        message: 'Organization request submitted successfully'
      });
    }
  );

  /**
   * @route   GET /api/v1/organization-requests/validate-owner-email/:email
   * @desc    Validate if owner email exists in database
   * @access  Private
   */
  public validateOwnerEmail = asyncHandler(
    async (req: Request, res: Response) => {
      const { email } = req.params;
      
      if (!email) {
        throw new ErrorResponse('Email parameter is required', 400);
      }

      const isValid = await this.organizationRequestService.validateOwnerEmail(email);
      
      res.status(200).json({
        success: true,
        data: { exists: isValid }
      });
    }
  );

  
}