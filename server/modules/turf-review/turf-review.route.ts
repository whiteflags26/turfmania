import express from "express";
import { protect } from "../auth/auth.middleware";
import TurfReviewController from "./turf-review.controller";

const router = express.Router();

// Protected routes
const turfReviewController = new TurfReviewController();
router.post("/review/", protect, turfReviewController.createTurfReview);
router.put("/review/:reviewId", protect, turfReviewController.updateReview);
router.delete("/review/:reviewId", protect, turfReviewController.deleteTurfReview);

// Public routes
router.get("/turf/:turfId", turfReviewController.getReviewsByTurf);
router.get("/review/:reviewId", turfReviewController.getReviewById);
router.get("/summary/:turfId", turfReviewController.getTurfReviewSummary);
router.get("/user/:userId", turfReviewController.getReviewsByUser);

export default router;
