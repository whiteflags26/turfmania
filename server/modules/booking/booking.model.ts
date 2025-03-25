import mongoose, { Document, Schema } from "mongoose";

export interface IBooking extends Document {
  user: mongoose.Types.ObjectId;
  turf: mongoose.Types.ObjectId;
  timeSlot: mongoose.Types.ObjectId;
  bookingDate: Date;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentAmount: number;
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema: Schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    turf: {
      type: Schema.Types.ObjectId,
      ref: "Turf",
      required: true,
      index: true
    },
    timeSlot: {
      type: Schema.Types.ObjectId,
      ref: "TimeSlot",
      required: true,
      index: true
    },
    bookingDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending',
      index: true
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending'
    },
    paymentAmount: {
      type: Number,
      required: true,
      min: 0,
      get: (v: number) => parseFloat(v.toFixed(2)),
      set: (v: number) => parseFloat(v.toFixed(2))
    },
    transactionId: {
      type: String
    }
  },
  { timestamps: true }
);

export const Booking = mongoose.model<IBooking>("Booking", BookingSchema);