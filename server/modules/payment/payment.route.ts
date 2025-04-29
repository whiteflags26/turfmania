import express from 'express';
import { protect } from '../auth/auth.middleware';
import PaymentController from './payment.controller';
import { standardApiLimiter } from '../../utils/rateLimiter';

const router = express.Router();

// Initialize controller
const paymentController = new PaymentController();

// Payment endpoints
router.post(
  '/create-payment-intent',
  standardApiLimiter,
  protect,
  paymentController.createPaymentIntent
);

router.post(
  '/process-payment',
  standardApiLimiter,
  protect,
  paymentController.processPayment
);

router.post(
  '/validate-transaction',
  standardApiLimiter,
  protect,
  paymentController.validateTransaction
);


  router.post(
    '/generate-test-transaction',
    standardApiLimiter,
    protect,
    paymentController.generateTestTransaction
  );


export default router;