import express from 'express';
import {
  adminLogin,
  forgotPassword,
  getMe,
  login,
  logout,
  organizationLogin,
  register,
  resetPassword,
  verifyEmail,
  resendVerificationEmail
} from './auth.controller';
import { protect } from './auth.middleware';

const router = express.Router();

router.post('/register', register);

router.post('/login', login);

router.post('/logout', logout);

router.get('/me', protect, getMe);

router.post('/forgot-password', forgotPassword);

router.post('/reset-password', resetPassword);

router.get('/verify-email', verifyEmail);

router.post('/admin/login',adminLogin)
router.post('/organization/:organizationId/login',organizationLogin)

router.post('/resend-verification', resendVerificationEmail);
export default router;
