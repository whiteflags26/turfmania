import { Request, Response, NextFunction } from 'express';
import asyncHandler from '../../shared/middleware/async';
import ErrorResponse from '../../utils/errorResponse';
import { AuthRequest } from '../auth/auth.middleware';
import { 
  processStripePayment, 
  validateStripeTransaction,
  createMockStripePaymentIntent
} from './payment.service';

export default class PaymentController {
  /**
   * @route   POST /api/v1/payments/create-payment-intent
   * @desc    Create a mock payment intent for frontend
   * @access  Private
   */
  public createPaymentIntent = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      if (!req.user) {
        throw new ErrorResponse('User not authenticated', 401);
      }

      const { amount, currency = 'usd', description } = req.body;

      // Validate input
      if (!amount || isNaN(parseFloat(amount))) {
        throw new ErrorResponse('Valid amount is required', 400);
      }

      // Create a mock payment intent for frontend
      const paymentIntent = createMockStripePaymentIntent(
        parseFloat(amount),
        currency
      );

      res.status(200).json({
        success: true,
        data: paymentIntent
      });
    }
  );

  /**
   * @route   POST /api/v1/payments/process-payment
   * @desc    Process a stripe payment
   * @access  Private
   */
  public processPayment = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      if (!req.user) {
        throw new ErrorResponse('User not authenticated', 401);
      }

      const { amount, currency = 'usd', description, paymentMethodId } = req.body;

      // Validate input
      if (!amount || isNaN(parseFloat(amount))) {
        throw new ErrorResponse('Valid amount is required', 400);
      }

      if (!paymentMethodId) {
        throw new ErrorResponse('Payment method ID is required', 400);
      }

      // Process the payment
      const transactionId = await processStripePayment(
        parseFloat(amount),
        currency,
        description || 'Turf booking payment',
        paymentMethodId
      );

      res.status(200).json({
        success: true,
        data: {
          transactionId,
          amount: parseFloat(amount),
          currency
        }
      });
    }
  );

  /**
   * @route   POST /api/v1/payments/validate-transaction
   * @desc    Validate a transaction ID
   * @access  Private
   */
  public validateTransaction = asyncHandler(
    async (req: Request, res: Response) => {
      const { transactionId } = req.body;

      if (!transactionId) {
        throw new ErrorResponse('Transaction ID is required', 400);
      }

      const isValid = await validateStripeTransaction(transactionId);

      res.status(200).json({
        success: true,
        data: {
          transactionId,
          isValid
        }
      });
    }
  );

  /**
   * @route   POST /api/v1/payments/generate-test-transaction
   * @desc    Generate a test transaction ID (dev/test only)
   * @access  Private
   */
  public generateTestTransaction = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { type = 'stripe' } = req.body;
      
      // Generate a prefix based on type
      const prefix = type === 'stripe' ? 'tr_' : 'cash_';
      
      // Generate random string
      const randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = prefix;
      
      for (let i = 0; i < 24; i++) {
        result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
      }
      
      res.status(200).json({
        success: true,
        data: {
          transactionId: result,
          type
        }
      });
    }
  );
}