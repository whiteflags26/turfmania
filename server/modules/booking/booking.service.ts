import mongoose, { Types } from 'mongoose';
import { Booking, BookingStatus, IBooking, PaymentMethod } from './booking.model';
import { TimeSlot } from '../timeslot/timeslot.model';
import { Turf } from '../turf/turf.model';
import ErrorResponse from '../../utils/errorResponse';
import { validateId } from '../../utils/validation';
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
   * Complete a booking with final payment
   */
  async completeBooking(bookingId: string, paymentData: CompleteBookingDto): Promise<IBooking> {
    try {
      const validBookingId = validateId(bookingId);

      const booking = await Booking.findById(validBookingId);
      if (!booking) {
        throw new ErrorResponse('Booking not found', 404);
      }

      if (booking.status !== 'advance_payment_completed') {
        throw new ErrorResponse('This booking cannot be completed due to its current status', 400);
      }

      // For cash payment, finalPaymentTransactionId is optional
      if (paymentData.finalPaymentMethod === 'stripe' && !paymentData.finalPaymentTransactionId) {
        throw new ErrorResponse('Transaction ID is required for Stripe payments', 400);
      }

      booking.finalPaymentMethod = paymentData.finalPaymentMethod;
      booking.finalPaymentTransactionId = paymentData.finalPaymentTransactionId;
      booking.status = 'completed';
      booking.isPaid = true;

      await booking.save();

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
   * Get all bookings with filters and pagination
   */
  async getBookings(
    filters: BookingFilters = {},
    pagination: PaginationOptions = { page: 1, limit: 10 }
  ): Promise<BookingsResult> {
    const {
      userId,
      turfId,
      status,
      fromDate,
      toDate,
      isPaid,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const { page, limit } = pagination;
    const query: any = {};

    // Apply filters
    if (userId) {
      query.userId = new Types.ObjectId(userId);
    }

    if (turfId) {
      query.turf = new Types.ObjectId(turfId);
    }

    if (status) {
      query.status = Array.isArray(status) ? { $in: status } : status;
    }

    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = fromDate;
      if (toDate) query.createdAt.$lte = toDate;
    }

    if (isPaid !== undefined) {
      query.isPaid = isPaid;
    }

    // Count total before pagination
    const total = await Booking.countDocuments(query);
    const pages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    // Build sort object
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Fetch paginated results
    const bookings = await Booking.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .populate('userId', 'first_name last_name email')
      .populate('turf', 'name location')
      .populate('timeSlots', 'start_time end_time');

    return {
      total,
      page,
      pages,
      bookings,
    };
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
      const validUserId = validateId(userId);

      // Prepare query object
      const query: any = { userId: validUserId };

      // Apply status filter if provided
      if (filters.status) {
        query.status = Array.isArray(filters.status) ? { $in: filters.status } : filters.status;
      }

      // Apply date filters if provided
      if (filters.fromDate || filters.toDate) {
        query.createdAt = {};
        if (filters.fromDate) query.createdAt.$gte = filters.fromDate;
        if (filters.toDate) query.createdAt.$lte = filters.toDate;
      }

      // Apply isPaid filter if provided
      if (filters.isPaid !== undefined) {
        query.isPaid = filters.isPaid;
      }

      // Determine sort options
      const sortBy = filters.sortBy || 'createdAt';
      const sortOrder = filters.sortOrder || 'desc';
      const sortOptions: any = {};
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Get pagination options
      const { page, limit } = pagination;
      const skip = (page - 1) * limit;

      // Count total documents
      const total = await Booking.countDocuments(query);
      const pages = Math.ceil(total / limit);

      // Fetch paginated bookings
      const bookings = await Booking.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate('turf', 'name basePrice')
        .populate('timeSlots', 'start_time end_time');

      return {
        total,
        page,
        pages,
        bookings,
      };
    } catch (error) {
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
      const validTurfId = validateId(turfId);

      // Prepare query object
      const query: any = { turf: validTurfId };

      // Apply status filter if provided
      if (filters.status) {
        query.status = Array.isArray(filters.status) ? { $in: filters.status } : filters.status;
      }

      // Apply date filters if provided
      if (filters.fromDate || filters.toDate) {
        query.createdAt = {};
        if (filters.fromDate) query.createdAt.$gte = filters.fromDate;
        if (filters.toDate) query.createdAt.$lte = filters.toDate;
      }

      // Apply isPaid filter if provided
      if (filters.isPaid !== undefined) {
        query.isPaid = filters.isPaid;
      }

      // Determine sort options
      const sortBy = filters.sortBy || 'createdAt';
      const sortOrder = filters.sortOrder || 'desc';
      const sortOptions: any = {};
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Get pagination options
      const { page, limit } = pagination;
      const skip = (page - 1) * limit;

      // Count total documents
      const total = await Booking.countDocuments(query);
      const pages = Math.ceil(total / limit);

      // Fetch paginated bookings
      const bookings = await Booking.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate('userId', 'first_name last_name email')
        .populate('timeSlots', 'start_time end_time');

      return {
        total,
        page,
        pages,
        bookings,
      };
    } catch (error) {
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
}