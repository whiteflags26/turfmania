import express from "express";
import {
  login,
  register,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  verifyEmail
} from "./auth.controller";
import { protect } from "./auth.middleware";

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.post("/logout", logout);

router.get("/me", protect, getMe);

router.post("/forgot-password", forgotPassword);

router.post("/reset-password", resetPassword);

router.get("/verify-email", verifyEmail);

export default router;
