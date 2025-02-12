import express from 'express';
import {
  forgotPassword,
  getMe,
  login,
  logout,
  register,
  resetPassword,
} from './auth.controller';
import { protect } from './auth.middleware';

const router = express.Router();

router.post('/register', register);

router.post('/login', login);

router.post('/logout', logout);

router.get('/me', protect, getMe);

router.post('/forgot-password', forgotPassword);

router.post('/reset-password', resetPassword);

export default router;
