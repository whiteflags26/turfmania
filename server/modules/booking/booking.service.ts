import mongoose, { Types } from 'mongoose';
import { Booking, BookingStatus, IBooking, PaymentMethod } from './booking.model';
import { TimeSlot } from '../timeslot/timeslot.model';
import { Turf } from '../turf/turf.model';
import ErrorResponse from '../../utils/errorResponse';
import { validateId } from '../../utils/validation';
import { sendEmail } from '../../utils/email';
import User from '../user/user.model';
import { z } from 'zod';

export interface CreateBookingDto {
  turfId: string;
  timeSlotIds: string[];
  advancePaymentTransactionId: string;
}

export interface CompleteBookingDto {
  finalPaymentMethod: PaymentMethod;
  finalPaymentTransactionId?: string;
}

export interface BookingFilters {
  userId?: string;
  turfId?: string;
  status?: BookingStatus | BookingStatus[];
  fromDate?: Date;
  toDate?: Date;
  isPaid?: boolean;
  sortBy?: 'createdAt' | 'updatedAt' | 'totalAmount';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface BookingsResult {
  total: number;
  page: number;
  pages: number;
  bookings: IBooking[];
}

export default class BookingService {
  private readonly ADVANCE_PAYMENT_PERCENTAGE = 0.65; // 65% advance payment
  private readonly ALLOWED_STATUSES = ['pending', 'advance_payment_completed', 'completed', 'cancelled'];
  private readonly ALLOWED_SORT_FIELDS = ['createdAt', 'updatedAt', 'totalAmount'];

  /**
   * Create a new booking with advance payment
   */
  async createBooking(userId: string, bookingData: CreateBookingDto): Promise<IBooking> {
    // Start a transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Validate IDs
      const validUserId = validateId(userId);
      const validTurfId = validateId(bookingData.turfId);
      const validTimeSlotIds = bookingData.timeSlotIds.map(id => validateId(id));

      // 1. Check if timeSlots are available
      const timeSlots = await TimeSlot.find({
        _id: { $in: validTimeSlotIds },
        is_available: true
      }).session(session);

      if (timeSlots.length !== validTimeSlotIds.length) {
        throw new ErrorResponse('One or more time slots are no longer available', 400);
      }

      // 2. Validate if all slots belong to the same turf
      const turfIds = timeSlots.map(slot => slot.turf.toString());
      if (new Set(turfIds).size !== 1 || turfIds[0] !== validTurfId) {
        throw new ErrorResponse('All time slots must belong to the same turf', 400);
      }

      // 3. Get turf for base price
      const turf = await Turf.findById(validTurfId).session(session);
      if (!turf) {
        throw new ErrorResponse('Turf not found', 404);
      }

      // 4. Calculate total, advance, and final amounts
      const basePrice = turf.basePrice || 0;
      const totalAmount = basePrice * timeSlots.length;
      const advanceAmount = totalAmount * this.ADVANCE_PAYMENT_PERCENTAGE;
      const finalAmount = totalAmount - advanceAmount;

      // 5. Create booking
      const booking = await Booking.create([{
        userId: new Types.ObjectId(validUserId),
        turf: new Types.ObjectId(validTurfId),
        timeSlots: timeSlots.map(slot => slot._id),
        totalAmount,
        advanceAmount,
        finalAmount,
        status: 'advance_payment_completed',
        advancePaymentTransactionId: bookingData.advancePaymentTransactionId,
        isPaid: false
      }], { session });

      // 6. Update time slots to not available and set booking reference
      await TimeSlot.updateMany(
        { _id: { $in: validTimeSlotIds } },
        {
          is_available: false,
          booking: booking[0]._id // Set the booking reference
        },
        { session }
      );

      // Commit transaction
      await session.commitTransaction();

      // send email
      await this.sendBookingConfirmationEmail(booking[0]);

      return booking[0];
    } catch (error) {
      // Abort transaction on error
      await session.abortTransaction();

      if (error instanceof z.ZodError) {
        throw new ErrorResponse('Invalid ID format', 400);
      }

      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
 * Complete a booking with Stripe payment
 */
  async completeBookingWithStripe(bookingId: string, transactionId: string): Promise<IBooking> {
    try {
      const validBookingId = validateId(bookingId);

      const booking = await Booking.findById(validBookingId);
      if (!booking) {
        throw new ErrorResponse('Booking not found', 404);
      }

      if (booking.status !== 'advance_payment_completed') {
        throw new ErrorResponse('This booking cannot be completed due to its current status', 400);
      }

      booking.finalPaymentMethod = 'stripe';
      booking.finalPaymentTransactionId = transactionId;
      booking.status = 'completed';
      booking.isPaid = true;

      await booking.save();

      // send email
      await this.sendBookingCompletionEmail(booking);

      return booking;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ErrorResponse('Invalid booking ID format', 400);
      }

      throw error;
    }
  }

  /**
   * Complete a booking with cash payment
   */
  async completeBookingWithCash(bookingId: string): Promise<IBooking> {
    try {
      const validBookingId = validateId(bookingId);

      const booking = await Booking.findById(validBookingId);
      if (!booking) {
        throw new ErrorResponse('Booking not found', 404);
      }

      if (booking.status !== 'advance_payment_completed') {
        throw new ErrorResponse('This booking cannot be completed due to its current status', 400);
      }

      booking.finalPaymentMethod = 'cash';
      booking.status = 'completed';
      booking.isPaid = true;

      await booking.save();

      // send email
      await this.sendBookingCompletionEmail(booking);

      return booking;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ErrorResponse('Invalid booking ID format', 400);
      }

      throw error;
    }
  }


  /**
   * Get booking by ID with relations
   */
  async getBookingById(bookingId: string): Promise<IBooking> {
    try {
      const validBookingId = validateId(bookingId);

      const booking = await Booking.findById(validBookingId)
        .populate('userId', 'first_name last_name email phone_number')
        .populate('turf')
        .populate('timeSlots');

      if (!booking) {
        throw new ErrorResponse('Booking not found', 404);
      }

      return booking;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ErrorResponse('Invalid booking ID format', 400);
      }

      throw error;
    }
  }

  /**
  * Sanitize and validate ObjectId
  * @private
  */
  private sanitizeObjectId(id: string, fieldName: string): Types.ObjectId {
    try {
      const validId = validateId(id);
      return new Types.ObjectId(validId);
    } catch (error) {
      throw new ErrorResponse(`Invalid ${fieldName} format`, 400);
    }
  }

  /**
   * Sanitize status filter
   * @private
   */
  private sanitizeStatusFilter(status: BookingStatus | BookingStatus[]): BookingStatus | { $in: BookingStatus[] } {
    if (Array.isArray(status)) {
      const validStatuses = status.filter(s =>
        this.ALLOWED_STATUSES.includes(s)
      );
      return validStatuses.length > 0 ? { $in: validStatuses } : { $in: [] };
    } else if (this.ALLOWED_STATUSES.includes(status)) {
      return status;
    }
    return { $in: [] }; // Return empty filter if invalid status
  }

  /**
   * Sanitize date filter
   * @private
   */
  private sanitizeDateFilter(fromDate?: Date, toDate?: Date): { $gte?: Date, $lte?: Date } | null {
    const dateFilter: { $gte?: Date, $lte?: Date } = {};
    let hasValidDate = false;

    if (fromDate) {
      const parsedFromDate = new Date(fromDate);
      if (!isNaN(parsedFromDate.getTime())) {
        dateFilter.$gte = parsedFromDate;
        hasValidDate = true;
      }
    }

    if (toDate) {
      const parsedToDate = new Date(toDate);
      if (!isNaN(parsedToDate.getTime())) {
        dateFilter.$lte = parsedToDate;
        hasValidDate = true;
      }
    }

    return hasValidDate ? dateFilter : null;
  }

  /**
   * Sanitize sort options
   * @private
   */
  private sanitizeSortOptions(sortBy?: string, sortOrder?: string): Record<string, 1 | -1> {
    const sortOptions: Record<string, 1 | -1> = {};
    const validSortBy = this.ALLOWED_SORT_FIELDS.includes(sortBy as any)
      ? sortBy
      : 'createdAt';

    const validSortOrder = sortOrder === 'asc' ? 1 : -1;
    sortOptions[validSortBy as string] = validSortOrder;

    return sortOptions;
  }

  /**
   * Build a sanitized query from filters
   * @private
   */
  private buildSanitizedQuery(filters: BookingFilters, baseQuery: Record<string, any> = {}): Record<string, any> {
    const query = { ...baseQuery };

    // userId filter (if not already in base query)
    if (filters.userId && !query.userId) {
      query.userId = this.sanitizeObjectId(filters.userId, 'user ID');
    }

    // turfId filter (if not already in base query)
    if (filters.turfId && !query.turf) {
      query.turf = this.sanitizeObjectId(filters.turfId, 'turf ID');
    }

    // Status filter
    if (filters.status) {
      query.status = this.sanitizeStatusFilter(filters.status);
    }

    // Date filters
    if (filters.fromDate || filters.toDate) {
      const dateFilter = this.sanitizeDateFilter(filters.fromDate, filters.toDate);
      if (dateFilter) {
        query.createdAt = dateFilter;
      }
    }

    // isPaid filter
    if (filters.isPaid !== undefined) {
      query.isPaid = Boolean(filters.isPaid);
    }

    return query;
  }

  /**
   * Execute paginated query with sanitized parameters
   * @private
   */
  private async executePaginatedQuery(
    query: Record<string, any>,
    sortOptions: Record<string, 1 | -1>,
    pagination: PaginationOptions,
    populate: Array<{ path: string, select?: string }> = []
  ): Promise<BookingsResult> {
    // Sanitize pagination
    const page = Math.max(1, pagination.page || 1);
    const limit = Math.min(50, Math.max(1, pagination.limit || 10));
    const skip = (page - 1) * limit;

    // Count total before pagination
    const total = await Booking.countDocuments(query);
    const pages = Math.ceil(total / limit);

    // Build query
    let bookingsQuery = Booking.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    // Apply population
    for (const pop of populate) {
      bookingsQuery = bookingsQuery.populate(pop.path, pop.select);
    }

    // Execute query
    const bookings = await bookingsQuery;

    return {
      total,
      page,
      pages,
      bookings,
    };
  }

  /**
   * Get all bookings with filters and pagination
   */
  async getBookings(
    filters: BookingFilters = {},
    pagination: PaginationOptions = { page: 1, limit: 10 }
  ): Promise<BookingsResult> {
    try {
      // Build sanitized query
      const query = this.buildSanitizedQuery(filters);

      // Build sanitized sort options
      const sortOptions = this.sanitizeSortOptions(filters.sortBy, filters.sortOrder);

      // Define populate options
      const populate = [
        { path: 'userId', select: 'first_name last_name email' },
        { path: 'turf', select: 'name location' },
        { path: 'timeSlots', select: 'start_time end_time' }
      ];

      // Execute query
      return await this.executePaginatedQuery(query, sortOptions, pagination, populate);
    } catch (error) {
      if (error instanceof ErrorResponse) {
        throw error;
      }
      throw new ErrorResponse('Error fetching bookings', 500);
    }
  }

  /**
   * Get user bookings with filters, sorting and pagination
   */
  async getUserBookings(
    userId: string,
    filters: BookingFilters = {},
    pagination: PaginationOptions = { page: 1, limit: 10 }
  ): Promise<BookingsResult> {
    try {
      // Validate user ID
      const validUserId = this.sanitizeObjectId(userId, 'user ID');

      // Build sanitized query with base query containing userId
      const query = this.buildSanitizedQuery(filters, { userId: validUserId });

      // Build sanitized sort options
      const sortOptions = this.sanitizeSortOptions(filters.sortBy, filters.sortOrder);

      // Define populate options
      const populate = [
        { path: 'turf', select: 'name basePrice' },
        { path: 'timeSlots', select: 'start_time end_time' }
      ];

      // Execute query
      return await this.executePaginatedQuery(query, sortOptions, pagination, populate);
    } catch (error) {
      if (error instanceof ErrorResponse) {
        throw error;
      }
      if (error instanceof z.ZodError) {
        throw new ErrorResponse('Invalid user ID format', 400);
      }
      throw error;
    }
  }

  /**
   * Get bookings for a specific turf with filters, sorting and pagination
   */
  async getTurfBookings(
    turfId: string,
    filters: BookingFilters = {},
    pagination: PaginationOptions = { page: 1, limit: 10 }
  ): Promise<BookingsResult> {
    try {
      // Validate turf ID
      const validTurfId = this.sanitizeObjectId(turfId, 'turf ID');

      // Build sanitized query with base query containing turfId
      const query = this.buildSanitizedQuery(filters, { turf: validTurfId });

      // Build sanitized sort options
      const sortOptions = this.sanitizeSortOptions(filters.sortBy, filters.sortOrder);

      // Define populate options
      const populate = [
        { path: 'userId', select: 'first_name last_name email' },
        { path: 'timeSlots', select: 'start_time end_time' }
      ];

      // Execute query
      return await this.executePaginatedQuery(query, sortOptions, pagination, populate);
    } catch (error) {
      if (error instanceof ErrorResponse) {
        throw error;
      }
      if (error instanceof z.ZodError) {
        throw new ErrorResponse('Invalid turf ID format', 400);
      }
      throw error;
    }
  }


  /**
   * Get monthly earnings for a turf for the current year
   */
  async getTurfMonthlyEarnings(turfId: string): Promise<{ month: number; earnings: number }[]> {
    try {
      const validTurfId = validateId(turfId);

      // Get current year
      const currentYear = new Date().getFullYear();
      const startDate = new Date(currentYear, 0, 1); // January 1st of current year
      const endDate = new Date(currentYear, 11, 31, 23, 59, 59); // December 31st of current year

      // Aggregate monthly earnings for completed bookings
      const monthlyEarnings = await Booking.aggregate([
        {
          $match: {
            turf: new Types.ObjectId(validTurfId),
            status: 'completed',
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: { $month: '$createdAt' },
            earnings: { $sum: '$totalAmount' }
          }
        },
        {
          $project: {
            _id: 0,
            month: '$_id',
            earnings: { $round: ['$earnings', 2] }
          }
        },
        {
          $sort: { month: 1 }
        }
      ]);

      // Create an array for all 12 months with 0 earnings as default
      const result = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        earnings: 0
      }));

      // Update earnings for months that have data
      monthlyEarnings.forEach(item => {
        result[item.month - 1].earnings = item.earnings;
      });

      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ErrorResponse('Invalid turf ID format', 400);
      }
      throw error;
    }
  }

  /**
   * Get current month's earnings for a turf
   */
  async getTurfCurrentMonthEarnings(turfId: string): Promise<{ earnings: number }> {
    try {
      const validTurfId = validateId(turfId);

      // Get current month's start and end dates
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      // Aggregate earnings for completed bookings in current month
      const result = await Booking.aggregate([
        {
          $match: {
            turf: new Types.ObjectId(validTurfId),
            status: 'completed',
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            earnings: { $sum: '$totalAmount' }
          }
        },
        {
          $project: {
            _id: 0,
            earnings: { $round: ['$earnings', 2] }
          }
        }
      ]);

      return result.length > 0 ? result[0] : { earnings: 0 };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ErrorResponse('Invalid turf ID format', 400);
      }
      throw error;
    }
  }

  /**
   * Get current month's earnings for an organization (all turfs combined)
   */
  async getOrganizationCurrentMonthEarnings(organizationId: string): Promise<{ earnings: number }> {
    try {
      const validOrgId = validateId(organizationId);

      // Get current month's start and end dates
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      // First get all turf IDs belonging to this organization
      const turfs = await Turf.find({ organization: validOrgId }, '_id');
      const turfIds = turfs.map(turf => turf._id);

      if (turfIds.length === 0) {
        return { earnings: 0 };
      }

      // Aggregate earnings for completed bookings across all turfs in current month
      const result = await Booking.aggregate([
        {
          $match: {
            turf: { $in: turfIds },
            status: 'completed',
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            earnings: { $sum: '$totalAmount' }
          }
        },
        {
          $project: {
            _id: 0,
            earnings: { $round: ['$earnings', 2] }
          }
        }
      ]);

      return result.length > 0 ? result[0] : { earnings: 0 };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ErrorResponse('Invalid organization ID format', 400);
      }
      throw error;
    }
  }

  private async sendBookingConfirmationEmail(booking: IBooking) {
    try {
      const user = await User.findById(booking.userId);
      if (!user || !user.email) return;

      const subject = 'Booking Confirmation';
      const text = `Dear ${user.first_name},\n\nYour booking has been confirmed.\n\nBooking ID: ${booking._id}\nTotal Amount: ${booking.totalAmount}\nAdvance Paid: ${booking.advanceAmount}\n\nThank you for using our service.`;

      await sendEmail(user.email, subject, text);
    } catch (error) {
      console.error('Error sending booking confirmation email:', error);
    }
  }

  private async sendBookingCompletionEmail(booking: IBooking) {
    try {
      const user = await User.findById(booking.userId);
      if (!user || !user.email) return;

      const subject = 'Booking Completed';
      const text = `Dear ${user.first_name},\n\nYour booking has been successfully completed.\n\nBooking ID: ${booking._id}\nFinal Amount Paid: ${booking.finalAmount}\nTotal Amount: ${booking.totalAmount}\n\nThank you for using our service.`;

      await sendEmail(user.email, subject, text);
    } catch (error) {
      console.error('Error sending booking completion email:', error);
    }
  }
}