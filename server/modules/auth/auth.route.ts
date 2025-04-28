import express from 'express';
import {
  adminLogin,
  forgotPassword,
  getMe,
  login,
  logout,
  register,
  resetPassword,
  verifyEmail,
  resendVerificationEmail
} from './auth.controller';
import { protect } from './auth.middleware';
import { authLimiter,standardApiLimiter } from '../../utils/rateLimiter';




const router = express.Router();

router.post('/register',authLimiter, register);

router.post('/login',authLimiter, login);

router.post('/logout', logout);

router.get('/me', protect, getMe);

router.post('/forgot-password',authLimiter, forgotPassword);

router.post('/reset-password',authLimiter, resetPassword);

router.get('/verify-email',authLimiter, verifyEmail);

router.post('/admin/login',authLimiter,adminLogin)

router.post('/resend-verification',authLimiter, resendVerificationEmail);
export default router;
