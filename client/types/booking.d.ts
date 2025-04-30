import { ITimeSlot } from "./timeslot";
import { ITurf } from "./turf";

export type BookingStatus = 
  | 'created' 
  | 'advance_payment_completed' 
  | 'completed' 
  | 'rejected';

export type PaymentMethod = 'stripe' | 'cash';

export interface IBooking {
  _id: string;
  userId: string;
  turf: string | ITurf;
  timeSlots: string[] | ITimeSlot[];
  totalAmount: number;
  advanceAmount: number;
  finalAmount: number;
  status: BookingStatus;
  advancePaymentTransactionId: string;
  finalPaymentTransactionId?: string;
  finalPaymentMethod?: PaymentMethod;
  isPaid: boolean;
  createdAt: string;
  updatedAt: string;
}