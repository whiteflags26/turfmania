import { Types } from "mongoose";

export interface ITimeSlot {
  _id: string;
  start_time: string | Date;
  end_time: string | Date;
  is_available: boolean;
  price_override?: number;
}

export interface IUser {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
}

export interface ITurf {
  _id: string;
  name: string;
  basePrice: number;
}

export type BookingStatus =
  | "created"
  | "advance_payment_completed"
  | "completed"
  | "rejected";

export type PaymentMethod = "stripe" | "cash";

export interface IBooking {
  _id: string;
  userId: string | IUser;
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

export interface BookingFilters {
  status?: BookingStatus | BookingStatus[];
  fromDate?: string;
  toDate?: string;
  isPaid?: boolean;
  sortBy?: "createdAt" | "updatedAt" | "totalAmount";
  sortOrder?: "asc" | "desc";
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface BookingsResponse {
  success: boolean;
  data: IBooking[];
  meta: {
    total: number;
    page: number;
    pages: number;
    filters: any;
  };
}

export interface CompleteBookingResponse {
  success: boolean;
  data: IBooking;
  message: string;
}

export interface MonthlyEarningResponse {
  success: boolean;
  data: { month: number; earnings: number }[];
}

export interface CurrentMonthEarningResponse {
  success: boolean;
  data: { earnings: number };
}
