import express from "express";
import {
  getCurrentUserProfile,
  getUserByIdAdmin,
  getUsersAdmin,
  updateUserProfile,
  changePassword,
} from "./user.controller";
import { protect } from "../auth/auth.middleware";

const router = express.Router({ mergeParams: true });

// Admin Endpoints

// Get all users
router.get(
  "/admin",
  protect,
  //   checkPermission('view_users'),
  getUsersAdmin
);

// Get user by ID
router.get(
  "/:userId/admin",
  //   checkPermission('view_users'),
  getUserByIdAdmin
);

//User endpoints

// Get current user's profile
router.get("/me", protect, getCurrentUserProfile);

// Update current user's profile
router.put("/me", protect, updateUserProfile);

// Change user password
router.put("/change-password", protect, changePassword);

export default router;
