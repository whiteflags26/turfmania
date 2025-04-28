import express from "express";
import {
  getCurrentUserProfile,
  getUserByIdAdmin,
  getUsersAdmin,
  updateUserProfile,
  changePassword,
  getUserOrganizations,
  getUsersWithoutGlobalRoles,
} from "./user.controller";
import { protect } from "../auth/auth.middleware";
import { standardApiLimiter } from "../../utils/rateLimiter";

const router = express.Router({ mergeParams: true });

// Admin Endpoints

// Get all users
router.get(
  "/admin",
  standardApiLimiter,
  protect,
  //   checkPermission('view_users'),
  getUsersAdmin
);

// Get user by ID
router.get(
  "/:userId/admin",
  standardApiLimiter,
  //   checkPermission('view_users'),
  getUserByIdAdmin
);

//User endpoints

// Get current user's profile
router.get("/me",standardApiLimiter, protect, getCurrentUserProfile);

// Update current user's profile
router.put("/me",standardApiLimiter, protect, updateUserProfile);

// Change user password
router.put("/change-password",standardApiLimiter, protect, changePassword);

// Get user's organizations
router.get("/organizations",standardApiLimiter, protect, getUserOrganizations);

router.get('/without-global-roles',standardApiLimiter, protect,getUsersWithoutGlobalRoles)

export default router;
