import mongoose, { Document, Schema } from 'mongoose';
export interface ITimeSlot extends Document {
  turf: mongoose.Types.ObjectId;
  start_time: Date;
  end_time: Date;
  is_available: boolean;
  price_override?: number;
  createdAt: Date;
  updatedAt: Date;
}

const TimeSlotSchema: Schema = new Schema(
  {
    turf: {
      type: Schema.Types.ObjectId,
      ref: 'Turf',
      required: true,
      index: true,
    },
    start_time: {
      type: Date,
      required: true,
      index: true,
    },
    end_time: {
      type: Date,
      required: true,
    },
    is_available: {
      type: Boolean,
      default: true,
      index: true,
    },
    price_override: {
      type: Number,
      min: 0,
      get: (v: number | undefined) =>
        v ? parseFloat(v.toFixed(2)) : undefined,
      set: (v: number | undefined) =>
        v ? parseFloat(v.toFixed(2)) : undefined,
    },
  },
  { timestamps: true },
);
TimeSlotSchema.index({ turf: 1, start_time: 1, is_available: 1 });
export const TimeSlot = mongoose.model<ITimeSlot>('TimeSlot', TimeSlotSchema);
