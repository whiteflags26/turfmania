// payment.util.ts - Utility for handling payments (dummy implementation for test mode)

/**
 * Processes a stripe payment (dummy implementation)
 * In production, this would interface with the Stripe API
 * 
 * @param amount - The amount to charge
 * @param currency - Currency code (default: 'usd')
 * @param description - Payment description
 * @param paymentMethodId - Stripe payment method ID
 * @returns A transaction ID for the payment
 */
export const processStripePayment = async (
    amount: number,
    currency: string = 'usd',
    description: string,
    paymentMethodId: string
  ): Promise<string> => {
    // In a real implementation, this would call the Stripe API
    // For now, we'll generate a dummy transaction ID
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Generate a random transaction ID
    const transactionId = 'tr_' + generateRandomString(24);
    
    console.log(`[STRIPE TEST MODE] Processing payment:`, {
      amount,
      currency,
      description,
      paymentMethodId,
      transactionId
    });
    
    return transactionId;
  };
  
  /**
 * Validates a Stripe transaction ID
 * In test mode, we'll accept any string starting with 'tr_'
 * 
 * @param transactionId - The transaction ID to validate
 * @returns Boolean indicating if transaction ID is valid
 */
export const validateStripeTransaction = async (transactionId: string): Promise<boolean> => {
  // In a real implementation, this would verify with Stripe API
  // For test mode, we'll just check if it starts with 'tr_'
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const isValid = Boolean(transactionId && transactionId.startsWith('tr_'));
  
  console.log(`[STRIPE TEST MODE] Validating transaction: ${transactionId}`, {
    isValid
  });
  
  return isValid;
};
  
  /**
   * Processes a cash payment (dummy implementation)
   * This would be handled by the turf staff in the physical location
   * 
   * @param amount - The amount received in cash
   * @param description - Payment description
   * @returns A transaction ID for the cash payment record
   */
  export const processCashPayment = (
    amount: number,
    description: string
  ): string => {
    // Generate a random transaction ID for cash payment
    const transactionId = 'cash_' + generateRandomString(16);
    
    console.log(`[CASH PAYMENT] Recording cash payment:`, {
      amount,
      description,
      transactionId
    });
    
    return transactionId;
  };
  
  /**
   * Calculates the advance payment amount based on total booking cost
   * 
   * @param totalAmount - The total booking amount
   * @param advancePercentage - Percentage of total to be paid as advance (default: 0.3 or 30%)
   * @returns The advance payment amount
   */
  export const calculateAdvancePayment = (
    totalAmount: number,
    advancePercentage: number = 0.3
  ): number => {
    const advanceAmount = totalAmount * advancePercentage;
    return parseFloat(advanceAmount.toFixed(2));
  };
  
  /**
   * Calculates the final payment amount after advance payment
   * 
   * @param totalAmount - The total booking amount
   * @param advanceAmount - The advance amount already paid
   * @returns The final payment amount
   */
  export const calculateFinalPayment = (
    totalAmount: number,
    advanceAmount: number
  ): number => {
    const finalAmount = totalAmount - advanceAmount;
    return parseFloat(finalAmount.toFixed(2));
  };
  
  /**
   * Generates a random string of specified length
   * Used for creating dummy transaction IDs
   * 
   * @param length - Length of the random string to generate
   * @returns Random alphanumeric string
   */
  const generateRandomString = (length: number): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  };
  
  /**
   * Creates a client-side mock Stripe payment intent
   * This can be used in the frontend to simulate Stripe payment without actual API calls
   * 
   * @param amount - The amount to charge
   * @param currency - Currency code (default: 'usd')
   * @returns A mock payment intent object similar to Stripe's
   */
  export const createMockStripePaymentIntent = (
    amount: number,
    currency: string = 'usd'
  ): any => {
    const mockPaymentIntentId = 'pi_' + generateRandomString(24);
    const mockClientSecret = 'pi_' + generateRandomString(24) + '_secret_' + generateRandomString(24);
    
    return {
      id: mockPaymentIntentId,
      object: 'payment_intent',
      amount: Math.round(amount * 100), // Convert to cents as Stripe does
      amount_received: 0,
      currency,
      client_secret: mockClientSecret,
      status: 'requires_payment_method',
      created: Math.floor(Date.now() / 1000),
    };
  };
  
  /**
   * Simulates a refund for cancelled bookings
   * 
   * @param transactionId - The original transaction ID to refund
   * @param amount - The amount to refund
   * @returns A refund transaction ID
   */
  export const processRefund = async (
    transactionId: string,
    amount: number
  ): Promise<string> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 700));
    
    // Generate a random refund ID
    const refundId = 're_' + generateRandomString(24);
    
    console.log(`[STRIPE TEST MODE] Processing refund:`, {
      originalTransaction: transactionId,
      amount,
      refundId
    });
    
    return refundId;
  };
  
 /**
 * Verifies a payment method (dummy implementation)
 * This would verify customer's payment method in production
 * 
 * @param paymentMethodId - Stripe payment method ID
 * @returns Boolean indicating if payment method is valid
 */
export const verifyPaymentMethod = async (paymentMethodId: string): Promise<boolean> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 400));
  
  // For test mode, we'll just check if the ID seems valid
  const isValid = Boolean(paymentMethodId && paymentMethodId.startsWith('pm_'));
  
  console.log(`[STRIPE TEST MODE] Verifying payment method: ${paymentMethodId}`, {
    isValid
  });
  
  return isValid;
};