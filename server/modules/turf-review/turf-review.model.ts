import mongoose, { Document, Schema } from "mongoose";

// review can be empty
// rating is interger and between 1 and 5
// review can be maximum 1000 characters or empty
// images can be empty or maximum 5
// used indexing for mongodb to prevent duplicate reviews
// 1 to 1 mapping between turf and user
// sparse is set to true to allow multiple null values
// background is set to true to allow background indexing


export interface ITurfReview extends Document {
  turf: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  rating: number;
  review?: string;
  images?: string[];
}

const TurfReviewSchema: Schema = new Schema(
  {
    turf: {
      type: Schema.Types.ObjectId,
      ref: "Turf",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: function (value: number) {
          return Number.isInteger(value);
        },
        message: "Turf rating must be an integer",
      },
    },
    review: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: function (s: string[]) {
          return s.length <= 5;
        },
        message: "Maximum 5 images allowed per review",
      },
    },
  },
  { timestamps: true }
);

TurfReviewSchema.index({ turf: 1, user: 1 },
  { unique: true,
    sparse: true,
    background: true,
   });

export const TurfReview = mongoose.model<ITurfReview>("TurfReview", TurfReviewSchema);
