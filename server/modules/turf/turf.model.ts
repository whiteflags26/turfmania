import mongoose, { Document, Schema } from "mongoose";

export interface ITurf extends Document {
  organization: mongoose.Types.ObjectId;
  price: number;
  sports: string[];
  team_size: number;
  time_slots: {
    start_time: Date;
    end_time: Date;
    is_available: boolean;
    price_override?: number;
  }[];
}

const TurfSchema: Schema = new Schema(
  {
    organization: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      get: (v: number) => parseFloat(v.toFixed(2)),
      set: (v: number) => parseFloat(v.toFixed(2)),
    },
    sports: { type: [String], required: true },
    team_size: { type: Number, required: true },
    time_slots: [
      {
        start_time: { type: Date, required: true },
        end_time: { type: Date, required: true },
        is_available: { type: Boolean, default: true },
        price_override: { type: Number, min: 0 },
      },
    ],
  },
  { timestamps: true }
);

export const Turf = mongoose.model<ITurf>("Turf", TurfSchema);
