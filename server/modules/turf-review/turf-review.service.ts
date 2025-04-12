import { ITurfReview, TurfReview } from "./turf-review.model";
import { Turf } from "../turf/turf.model";
import User from "../user/user.model";

interface CreateReviewData {
  turfId: string;
  userId: string;
  rating: number;
  review: string;
  images: string[];
}

interface UpdateReviewData {
  rating?: number;
  review?: string;
  images?: string[];
}

interface ReviewFilterOptions {
  turfId?: string;
  userId?: string;
  minRating?: number;
  maxRating?: number;
  limit?: number;
  skip?: number; //for pagination
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export default class TurfReviewService {
  // create a new review
  async createReview(data: CreateReviewData): Promise<ITurfReview> {
    const userExits = await User.exists({ _id: data.userId });
    if (!userExits) {
      throw new Error("User not found");
    }

    const turfExits = await Turf.exists({ _id: data.turfId });
    if (!turfExits) {
      throw new Error("Turf not found");
    }

    const existingReview = await TurfReview.findOne({
      turf: data.turfId,
      user: data.userId,
    });

    if (existingReview) {
      throw new Error("User has already reviewed this turf");
    }

    const turfReview = new TurfReview({
      turf: data.turfId,
      user: data.userId,
      rating: data.rating,
      review: data.review,
      images: data.images || [],
    });

    const newReview = await turfReview.save();

    // Update the User document
    await User.findByIdAndUpdate(data.userId, {
      $push: { reviews: newReview._id },
    });

    // Update the Turf document
    await Turf.findByIdAndUpdate(data.turfId, {
      $push: { reviews: newReview._id },
    });

    return newReview;
  }

  // update an exiting review
  async updateReview(
    reviewId: string,
    userId: string,
    data: UpdateReviewData
  ): Promise<ITurfReview | null> {
    const review = await TurfReview.findOne({
      _id: reviewId,
      user: userId,
    });

    if (!review) {
      throw new Error("Review not found or user not authorized");
    }

    if (data.rating !== undefined) review.rating = data.rating;
    if (data.review !== undefined) review.review = data.review;
    if (data.images !== undefined) review.images = data.images;

    return await review.save();
  }

  // delete a review
  async deleteReview(reviewId: string, userId: string): Promise<boolean> {
    const review = await TurfReview.findById(reviewId);

    if (!review) {
      throw new Error("Review not found");
    }
    if (review.user.toString() !== userId) {
      throw new Error("You are not authorized to delete this review");
    }

    await review.deleteOne();

    // Update the User document
    await User.findByIdAndUpdate(userId, {
      $pull: { reviews: reviewId },
    });

    // Update the Turf document
    await Turf.findByIdAndUpdate(review.turf, {
      $pull: { reviews: reviewId },
    });

    return true;
  }
}
