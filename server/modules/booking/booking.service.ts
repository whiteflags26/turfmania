import { Booking, IBooking } from './booking.model';
import { TimeSlot } from '../timeslot/timeslot.model';
import { Turf } from '../turf/turf.model';
import mongoose from 'mongoose';

export default class BookingService {
  async createBooking(bookingData: Partial<IBooking>): Promise<IBooking> {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // 1. Check if the slot is available
      const timeSlot = await TimeSlot.findById(bookingData.timeSlot);
      if (!timeSlot || !timeSlot.is_available) {
        throw new Error("Time slot not available");
      }
      
      // 2. Calculate price
      const turf = await Turf.findById(bookingData.turf);
      if (!turf) {
        throw new Error("Turf not found");
      }
      
      const price = timeSlot.price_override || turf.basePrice;
      
      // 3. Create booking
      const booking = new Booking({
        ...bookingData,
        paymentAmount: price,
        status: 'pending',
        paymentStatus: 'pending'
      });
      
      await booking.save({ session });
      
      // 4. Update time slot availability
      timeSlot.is_available = false;
      await timeSlot.save({ session });
      
      await session.commitTransaction();
      return booking;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getBookings(filters = {}): Promise<IBooking[]> {
    return await Booking.find(filters)
      .populate('user', '-password')
      .populate('turf')
      .populate('timeSlot')
      .sort('-bookingDate');
  }

  async getBookingById(id: string): Promise<IBooking | null> {
    return await Booking.findById(id)
      .populate('user', '-password')
      .populate('turf')
      .populate('timeSlot');
  }

  async getUserBookings(userId: string): Promise<IBooking[]> {
    return await Booking.find({ user: userId })
      .populate('turf')
      .populate('timeSlot')
      .sort('-bookingDate');
  }

  async updateBookingStatus(
    id: string, 
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed',
    paymentStatus?: 'pending' | 'paid' | 'refunded',
    transactionId?: string
  ): Promise<IBooking | null> {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const booking = await Booking.findById(id);
      if (!booking) throw new Error("Booking not found");
      
      const updateData: any = { status };
      if (paymentStatus) updateData.paymentStatus = paymentStatus;
      if (transactionId) updateData.transactionId = transactionId;
      
      const updatedBooking = await Booking.findByIdAndUpdate(
        id,
        updateData,
        { new: true, session }
      );
      
      // If cancelled, make the time slot available again
      if (status === 'cancelled') {
        await TimeSlot.findByIdAndUpdate(
          booking.timeSlot,
          { is_available: true },
          { session }
        );
      }
      
      await session.commitTransaction();
      return updatedBooking;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}