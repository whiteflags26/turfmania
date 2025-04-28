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
import rateLimit from 'express-rate-limit';
const createRateLimiter = (windowMinutes:number, maxRequests:number) => {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000, // convert minutes to milliseconds
    max: maxRequests, // limit each IP to maxRequests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: 'Too many requests, please try again later.',
  });
};

// Create different limiters for different routes
const authLimiter = createRateLimiter(15, 5); // 5 requests per 15 minutes
const apiLimiter = createRateLimiter(15, 100);

const router = express.Router();

router.post('/register', register);

router.post('/login', login);

router.post('/logout', logout);

router.get('/me', protect, getMe);

router.post('/forgot-password', forgotPassword);

router.post('/reset-password', resetPassword);

router.get('/verify-email', verifyEmail);

router.post('/admin/login',adminLogin)

router.post('/resend-verification', resendVerificationEmail);
export default router;
