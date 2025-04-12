import express from "express";
import { protect } from "../auth/auth.middleware";
import TurfReviewController from "./turf-review.controller";

const router = express.Router();

// Protected routes
const turfReviewController = new TurfReviewController();
router.post('/', protect, turfReviewController.CreateTurfReview);
router.put('/:reviewId', protect, turfReviewController.UpdateReview);
router.delete('/:id', protect, turfReviewController.DeleteTurfReview);

// Public routes
router.get('/turf/:turfId', turfReviewController.GetReviewsByTurf);


export default router;
