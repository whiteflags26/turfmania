import { ITurfReview, TurfReview } from "./turf-review.model";
import { Turf } from "../turf/turf.model";
import User from "../user/user.model";
import mongoose from "mongoose";
import { uploadImage, deleteImage } from "../../utils/cloudinary";
import { extractPublicIdFromUrl } from "../../utils/extractUrl";

interface CreateReviewData {
  turfId: string;
  userId: string;
  rating: number;
  review?: string;
  images?: Express.Multer.File[];
}

interface UpdateReviewData {
  rating?: number;
  review?: string;
  images?: Express.Multer.File[];
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

export interface ReviewSummary {
  reviews: ITurfReview[];
  total: number;
  averageRating: number;
  ratingDistribution: { [rating: number]: number };
}

export default class TurfReviewService {
  // Create a new review
  async createReview(data: CreateReviewData): Promise<ITurfReview> {
    const userExists = await User.exists({ _id: data.userId });
    if (!userExists) {
      throw new Error("User not found");
    }

    const turfExists = await Turf.exists({ _id: data.turfId });
    if (!turfExists) {
      throw new Error("Turf not found");
    }

    const existingReview = await TurfReview.findOne({
      turf: data.turfId,
      user: data.userId,
    });

    if (existingReview) {
      throw new Error("User has already reviewed this turf");
    }

    // Upload images if provided
    let imageUrls: string[] = [];
    if (data.images && data.images.length > 0) {
      const uploadPromises = data.images.map((image) => uploadImage(image));
      const uploadedImages = await Promise.all(uploadPromises);
      imageUrls = uploadedImages.map((img) => img.url);
    }

    const turfReview = new TurfReview({
      turf: data.turfId,
      user: data.userId,
      rating: data.rating,
      review: data.review,
      images: imageUrls,
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

  // Update an existing review
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

    let newImageUrls: string[] | undefined;

    // Handle image updates
    if (data.images && data.images.length > 0) {
      // Upload new images
      const uploadPromises = data.images.map((image) => uploadImage(image));
      const uploadedImages = await Promise.all(uploadPromises);
      newImageUrls = uploadedImages.map((img) => img.url);

      // Delete old images if they exist
      if (review.images && review.images.length > 0) {
        await Promise.all(
          review.images.map((imgUrl) => {
            const publicId = extractPublicIdFromUrl(imgUrl);
            return publicId ? deleteImage(publicId) : Promise.resolve();
          })
        );
      }
    }

    // Prepare update payload
    const updatePayload: any = {
      rating: data.rating,
      review: data.review,
    };

    if (newImageUrls) {
      updatePayload.images = newImageUrls;
    }

    // Update the review
    const updatedReview = await TurfReview.findByIdAndUpdate(
      reviewId,
      { $set: updatePayload },
      { new: true, runValidators: true }
    );

    return updatedReview;
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

    // Delete images from Cloudinary
    if (review.images && review.images.length > 0) {
      await Promise.all(
        review.images.map(async (imageUrl) => {
          const publicId = extractPublicIdFromUrl(imageUrl);
          if (publicId) {
            await deleteImage(publicId);
          }
        })
      );
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

  // Get all reviews for a specific turf and their average rating and rating distribution
  async getReviewsByTurf(
    turfId: string,
    options: ReviewFilterOptions = {}
  ): Promise<ReviewSummary> {
    const filter = { turf: turfId };
    const matchStage = { turf: new mongoose.Types.ObjectId(turfId) };

    // Use the extracted common method
    return this.getReviewsWithStats(
      filter,
      matchStage,
      {
        populateField: "user",
        populateSelect: "_id first_name last_name email isVerified",
      },
      options
    );
  }

  // Get a single review by ID
  async getReviewById(reviewId: string): Promise<ITurfReview | null> {
    return await TurfReview.findById(reviewId)
      .populate("user", "_id first_name last_name email isVerified")
      .populate("turf", "_id name organization sports team_size")
      .lean();
  }

  // Get a summary of reviews for a specific turf
  async getTurfReviewSummary(turfId: string) {
    const result = await TurfReview.aggregate([
      { $match: { turf: new mongoose.Types.ObjectId(turfId) } },
      {
        $group: {
          _id: "$turf",
          averageRating: { $avg: "$rating" },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    return result[0] ?? { averageRating: 0, reviewCount: 0 };
  }

  // Get reviews by user
  async getReviewsByUser(
    userId: string,
    options: ReviewFilterOptions = {}
  ): Promise<ReviewSummary> {
    const filter = { user: userId };
    const matchStage = { user: new mongoose.Types.ObjectId(userId) };

    // Use the extracted common method
    return this.getReviewsWithStats(
      filter,
      matchStage,
      {
        populateField: "turf",
        populateSelect: "_id name organization sports team_size",
      },
      options
    );
  }

  // Common method for retrieving reviews with stats
  private async getReviewsWithStats(
    filter: any,
    matchStage: any,
    populateOptions: { populateField: string; populateSelect: string },
    options: ReviewFilterOptions = {}
  ): Promise<ReviewSummary> {
    // Apply rating filters
    this.applyRatingFilters(filter, matchStage, options);

    // Get pagination and sorting options
    const paginationSort = this.getPaginationAndSortOptions(options);

    const [reviews, total, ratingStats] = await Promise.all([
      TurfReview.find(filter)
        .sort(paginationSort.sort)
        .skip(paginationSort.skip)
        .limit(paginationSort.limit)
        .populate(populateOptions.populateField, populateOptions.populateSelect)
        .lean(),
      TurfReview.countDocuments(filter),
      TurfReview.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: "$rating",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    return {
      reviews,
      total,
      ...this.calculateRatingStats(ratingStats),
    };
  }

  // Helper to apply rating filters to both filter object and match stage
  private applyRatingFilters(
    filter: any,
    matchStage: any,
    options: ReviewFilterOptions
  ): void {
    if (options.minRating !== undefined) {
      filter.rating = { $gte: options.minRating };
      matchStage.rating = { $gte: options.minRating };
    }

    if (options.maxRating !== undefined) {
      filter.rating = { ...filter.rating, $lte: options.maxRating };
      matchStage.rating = { ...matchStage.rating, $lte: options.maxRating };
    }
  }

  // Helper to get pagination and sort options
  private getPaginationAndSortOptions(options: ReviewFilterOptions): {
    limit: number;
    skip: number;
    sort: any;
  } {
    const limit = options.limit ?? 10;
    const skip = options.skip ?? 0;
    const sort: any = {};
    sort[options.sortBy ?? "createdAt"] = options.sortOrder === "asc" ? 1 : -1;

    return { limit, skip, sort };
  }

  // Helper to calculate rating statistics from aggregation results
  private calculateRatingStats(ratingStats: any[]): {
    averageRating: number;
    ratingDistribution: { [rating: number]: number };
  } {
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

    const averageRating =
      totalReviewsCount > 0 ? totalRatingsSum / totalReviewsCount : 0;

    return {
      averageRating,
      ratingDistribution,
    };
  }
}
