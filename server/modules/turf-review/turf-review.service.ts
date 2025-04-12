import { ITurfReview, TurfReview } from "./turf-review.model";
import { Turf } from "../turf/turf.model";
import User from "../user/user.model";
import mongoose from "mongoose";

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

export interface ReviewFilterOptions {
  turfId?: string;
  userId?: string;
  minRating?: number;
  maxRating?: number;
  limit?: number;
  skip?: number; 
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export default class TurfReviewService {
  // Create a new review
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

  // Update an exiting review
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

  // Delete a review
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

  // Get all reviews for a specific turf and their avarage rating and rating distribution
  async getReviewsByTurf(
    turfId: string,
    options: ReviewFilterOptions = {}
  ): Promise<{
    reviews: ITurfReview[];
    total: number;
    averageRating: number;
    ratingDistribution: { [rating: number]: number };
  }> {
    const filter: any = { turf: turfId };
  
    if (options.minRating) filter.rating = { $gte: options.minRating };
    if (options.maxRating) {
      filter.rating = { ...filter.rating, $lte: options.maxRating };
    }
  
    const limit = options.limit || 10;
    const skip = options.skip || 0;
    const sort: any = {};
    sort[options.sortBy || "createdAt"] = options.sortOrder === "asc" ? 1 : -1;
  
    const [reviews, total, ratingStats] = await Promise.all([
      TurfReview.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate("user", "first_name last_name email isVerified")
        .lean(),
      TurfReview.countDocuments(filter),
      TurfReview.aggregate([
        { $match: { turf: new mongoose.Types.ObjectId(turfId) } },
        {
          $group: {
            _id: "$rating",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);
  
    let totalRatingsSum = 0;
    let totalReviewsCount = 0;
    const ratingDistribution: { [rating: number]: number } = {};
  
    for (const stat of ratingStats) {
      const rating = stat._id;  
      const count = stat.count; 
      ratingDistribution[rating] = count;
      totalRatingsSum += rating * count;
      totalReviewsCount += count;
    }
  
    const averageRating = totalReviewsCount > 0 ? totalRatingsSum / totalReviewsCount : 0;
  
    return {
      reviews,
      total,
      averageRating,
      ratingDistribution,
    };
  }
  
}
