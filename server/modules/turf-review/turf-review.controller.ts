import { Response } from "express";
import asyncHandler from "../../shared/middleware/async";
import TurfReviewService from "./turf-review.service";
import { AuthenticatedRequest } from "../../types/request";
import { getUserId } from "../../utils/getUserId";

export default class TurfReviewController {
  private readonly turfReviewService: TurfReviewService;

  constructor() {
    this.turfReviewService = new TurfReviewService();
  }

  /**
   * @route   POST /api/v1/turf-review
   * @desc    create a new review
   * @access  Private
   */

  public CreateTurfReview = asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const { turfId, rating, review, images } = req.body;

      const userId = getUserId(req);

      const newTurfReview = await this.turfReviewService.createReview({
        turfId,
        userId,
        rating,
        review,
        images,
      });

      res.status(201).json({
        success: true,
        data: newTurfReview,
      });
    }
  );

  /**
   * @route   DELETE /api/v1/turf-review/:id
   * @desc    delete a review
   * @access  Private
   */

  public DeleteTurfReview = asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const userId = getUserId(req);
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: "Review ID is required",
        });
        return;
      }

      await this.turfReviewService.deleteReview(id, userId);

      res.status(200).json({
        success: true,
        message: "Review deleted successfully",
      });
    }
  );
}
