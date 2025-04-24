import express from "express";
import { protect } from "../auth/auth.middleware";
import TurfReviewController from "./turf-review.controller";
import multer from "multer";

const router = express.Router();

// Configure Multer
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({
  storage,
  limits: {
    fileSize: 3 * 1024 * 1024, // 3MB limit per file
    files: 2, // Maximum of 2 files
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.match(/^image\/(jpeg|png|jpg|gif)$/)) {
      return cb(new Error("Only image files are allowed!"));
    }
    cb(null, true);
  },
});

// Protected routes
const turfReviewController = new TurfReviewController();
router.post("/review/", protect, upload.array("images", 2), turfReviewController.createTurfReview);
router.put("/review/:reviewId", protect, upload.array("images", 2), turfReviewController.updateReview);
router.delete("/review/:reviewId", protect, turfReviewController.deleteTurfReview);

// Public routes
router.get("/turf/:turfId", turfReviewController.getReviewsByTurf);
router.get("/review/:reviewId", turfReviewController.getReviewById);
router.get("/summary/:turfId", turfReviewController.getTurfReviewSummary);
router.get("/user/:userId", turfReviewController.getReviewsByUser);

export default router;