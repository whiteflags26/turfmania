// payment-client.ts
// Simple client for interacting with the payment API in the frontend

const API_BASE_URL = '/api/v1';

/**
 * Create a payment intent for advance payment
 * 
 * @param amount - The amount to be paid
 * @param description - Description of the payment
 * @returns Payment intent object with client secret
 */
export const createPaymentIntent = async (
  amount: number,
  description: string = 'Turf booking advance payment'
): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/payments/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount,
        description
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create payment intent');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

/**
 * Process a payment with Stripe
 * 
 * @param amount - The amount to be paid
 * @param paymentMethodId - The Stripe payment method ID
 * @param description - Description of the payment
 * @returns Transaction details including transaction ID
 */
export const processPayment = async (
  amount: number,
  paymentMethodId: string,
  description: string = 'Turf booking payment'
): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/payments/process-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount,
        paymentMethodId,
        description
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Payment processing failed');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error processing payment:', error);
    throw error;
  }
};

/**
 * Validate a transaction ID
 * 
 * @param transactionId - The transaction ID to validate
 * @returns Validation result
 */
export const validateTransaction = async (transactionId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/payments/validate-transaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        transactionId
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Transaction validation failed');
    }

    const data = await response.json();
    return data.data.isValid;
  } catch (error) {
    console.error('Error validating transaction:', error);
    throw error;
  }
};

/**
 * Generate a test transaction ID (for development/testing only)
 * 
 * @param type - Type of transaction ('stripe' or 'cash')
 * @returns Generated transaction ID
 */
export const generateTestTransaction = async (type: 'stripe' | 'cash' = 'stripe'): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/payments/generate-test-transaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate test transaction');
    }

    const data = await response.json();
    return data.data.transactionId;
  } catch (error) {
    console.error('Error generating test transaction:', error);
    throw error;
  }
};