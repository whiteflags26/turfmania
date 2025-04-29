import { NextFunction, Request, Response } from 'express';
import validator from 'validator';
import asyncHandler from '../../shared/middleware/async';
import ErrorResponse from '../../utils/errorResponse';
import { AuthRequest } from '../auth/auth.middleware';
import BookingService, { BookingFilters, PaginationOptions } from './booking.service';
import { PaymentMethod } from './booking.model';

export default class BookingController {
  private readonly bookingService: BookingService;

  constructor() {
    this.bookingService = new BookingService();
  }

  /**
   * @route   POST /api/v1/bookings
   * @desc    Create a new booking with advance payment
   * @access  Private
   */
  public createBooking = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw new ErrorResponse('User not authenticated', 401);
      }

      const { turfId, timeSlotIds, advancePaymentTransactionId } = req.body;

      // Validate required fields
      if (!turfId || !timeSlotIds || !advancePaymentTransactionId) {
        throw new ErrorResponse('Missing required fields', 400);
      }

      // Validate timeSlotIds is an array
      if (!Array.isArray(timeSlotIds) || timeSlotIds.length === 0) {
        throw new ErrorResponse('Time slots must be a non-empty array', 400);
      }
      
      // Create booking
      const booking = await this.bookingService.createBooking(req.user.id, {
        turfId: validator.trim(turfId),
        timeSlotIds: timeSlotIds.map(id => validator.trim(id.toString())),
        advancePaymentTransactionId: validator.trim(advancePaymentTransactionId)
      });

      res.status(201).json({
        success: true,
        data: booking,
        message: 'Booking created successfully'
      });
    }
  );

  /**
   * @route   PUT /api/v1/bookings/:id/complete
   * @desc    Complete a booking with final payment
   * @access  Private
   */
  public completeBooking = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      if (!req.user) {
        throw new ErrorResponse('User not authenticated', 401);
      }

      const { id } = req.params;
      const { finalPaymentMethod, finalPaymentTransactionId } = req.body;

      // Validate required fields
      if (!finalPaymentMethod) {
        throw new ErrorResponse('Payment method is required', 400);
      }

      // Validate payment method
      if (!['stripe', 'cash'].includes(finalPaymentMethod)) {
        throw new ErrorResponse('Invalid payment method', 400);
      }

      // Complete booking
      const booking = await this.bookingService.completeBooking(id, {
        finalPaymentMethod: finalPaymentMethod as PaymentMethod,
        finalPaymentTransactionId: finalPaymentTransactionId
          ? validator.trim(finalPaymentTransactionId)
          : undefined
      });

      res.status(200).json({
        success: true,
        data: booking,
        message: 'Booking completed successfully'
      });
    }
  );

  /**
   * @route   GET /api/v1/bookings/:id
   * @desc    Get booking by ID
   * @access  Private
   */
  public getBooking = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      if (!req.user) {
        throw new ErrorResponse('User not authenticated', 401);
      }

      const { id } = req.params;
      const booking = await this.bookingService.getBookingById(id);

      // Check if user is authorized to view this booking
      if (!booking.userId.equals(req.user.id)) {
        throw new ErrorResponse('Not authorized to view this booking', 403);
      }

      res.status(200).json({
        success: true,
        data: booking
      });
    }
  );

  /**
   * @route   GET /api/v1/bookings/admin/:id
   * @desc    Get booking by ID (admin access)
   * @access  Private (Admin only)
   */
  public getBookingAsAdmin = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      if (!req.user) {
        throw new ErrorResponse('User not authenticated', 401);
      }

      const { id } = req.params;
      const booking = await this.bookingService.getBookingById(id);

      res.status(200).json({
        success: true,
        data: booking
      });
    }
  );

  /**
   * Extract filter options from request query parameters
   * @private
   */
  private extractBookingFilters(req: Request): BookingFilters {
    const status = req.query.status as string;
    const fromDate = req.query.fromDate
      ? new Date(req.query.fromDate as string)
      : undefined;
    const toDate = req.query.toDate
      ? new Date(req.query.toDate as string)
      : undefined;
    const userId = req.query.userId as string;
    const turfId = req.query.turfId as string;
    const isPaid = req.query.isPaid !== undefined ?
      req.query.isPaid === 'true' : undefined;
    const sortBy = req.query.sortBy as
      | 'createdAt'
      | 'updatedAt'
      | 'totalAmount';
    const sortOrder = req.query.sortOrder as 'asc' | 'desc';

    const filters: BookingFilters = {};

    // Add filters
    if (status) {
      filters.status = status.includes(',')
        ? status.split(',') as any[]
        : status as any;
    }

    if (fromDate) filters.fromDate = fromDate;
    if (toDate) filters.toDate = toDate;
    if (userId) filters.userId = userId;
    if (turfId) filters.turfId = turfId;
    if (isPaid !== undefined) filters.isPaid = isPaid;

    // Add sorting options
    if (sortBy && ['createdAt', 'updatedAt', 'totalAmount'].includes(sortBy)) {
      filters.sortBy = sortBy;
    }

    if (sortOrder && ['asc', 'desc'].includes(sortOrder)) {
      filters.sortOrder = sortOrder;
    }

    return filters;
  }

  /**
   * Extract pagination options from request query parameters
   * @private
   */
  private extractPaginationOptions(req: Request): PaginationOptions {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit as string) || 10)
    );
    return { page, limit };
  }

  /**
   * @route   GET /api/v1/bookings
   * @desc    Get all bookings with filtering and pagination (admin only)
   * @access  Private (Admin only)
   */
  public getAllBookings = asyncHandler(
    async (req: Request, res: Response) => {
      const filters = this.extractBookingFilters(req);
      const pagination = this.extractPaginationOptions(req);

      const results = await this.bookingService.getBookings(
        filters,
        pagination
      );

      res.status(200).json({
        success: true,
        data: results.bookings,
        meta: {
          total: results.total,
          page: results.page,
          pages: results.pages,
          filters: filters,
        },
      });
    }
  );

  /**
 * @route   GET /api/v1/bookings/user/filter
 * @desc    Get user bookings with filtering, sorting and pagination
 * @access  Private
 */
  public getUserBookings = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw new ErrorResponse('User not authenticated', 401);
      }

      const filters = this.extractBookingFilters(req);
      const pagination = this.extractPaginationOptions(req);

      const results = await this.bookingService.getUserBookings(
        req.user.id,
        filters,
        pagination
      );

      res.status(200).json({
        success: true,
        data: results.bookings,
        meta: {
          total: results.total,
          page: results.page,
          pages: results.pages,
          filters: filters,
        },
      });
    }
  );

  /**
   * @route   GET /api/v1/bookings/turf/:turfId
   * @desc    Get bookings for a specific turf with filtering, sorting and pagination
   * @access  Private (Admin/Turf Manager)
   */
  public getTurfBookings = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw new ErrorResponse('User not authenticated', 401);
      }

      const { turfId } = req.params;
      if (!turfId) {
        throw new ErrorResponse('Turf ID is required', 400);
      }

      const filters = this.extractBookingFilters(req);
      const pagination = this.extractPaginationOptions(req);

      const results = await this.bookingService.getTurfBookings(
        turfId,
        filters,
        pagination
      );

      res.status(200).json({
        success: true,
        data: results.bookings,
        meta: {
          total: results.total,
          page: results.page,
          pages: results.pages,
          filters: filters,
        },
      });
    }
  );

  /**
   * @route   GET /api/v1/bookings/turf/:turfId/monthly-earnings
   * @desc    Get monthly earnings for a turf for the current year
   * @access  Private (Admin/Turf Manager)
   */
  public getTurfMonthlyEarnings = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw new ErrorResponse('User not authenticated', 401);
      }

      const { turfId } = req.params;
      if (!turfId) {
        throw new ErrorResponse('Turf ID is required', 400);
      }

      const earnings = await this.bookingService.getTurfMonthlyEarnings(turfId);

      res.status(200).json({
        success: true,
        data: earnings,
      });
    }
  );

  /**
   * @route   GET /api/v1/bookings/turf/:turfId/current-month-earnings
   * @desc    Get current month's earnings for a turf
   * @access  Private (Admin/Turf Manager)
   */
  public getTurfCurrentMonthEarnings = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw new ErrorResponse('User not authenticated', 401);
      }

      const { turfId } = req.params;
      if (!turfId) {
        throw new ErrorResponse('Turf ID is required', 400);
      }

      const earnings = await this.bookingService.getTurfCurrentMonthEarnings(turfId);

      res.status(200).json({
        success: true,
        data: earnings,
      });
    }
  );

  /**
   * @route   GET /api/v1/bookings/organization/:organizationId/current-month-earnings
   * @desc    Get current month's earnings for an organization (all turfs combined)
   * @access  Private (Admin/Organization Manager)
   */
  public getOrganizationCurrentMonthEarnings = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw new ErrorResponse('User not authenticated', 401);
      }

      const { organizationId } = req.params;
      if (!organizationId) {
        throw new ErrorResponse('Organization ID is required', 400);
      }

      const earnings = await this.bookingService.getOrganizationCurrentMonthEarnings(organizationId);

      res.status(200).json({
        success: true,
        data: earnings,
      });
    }
  );
}