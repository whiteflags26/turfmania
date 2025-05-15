import { IBooking } from "@/types/booking";

interface CompleteBookingResponse {
  success: boolean;
  data: IBooking;
  message: string;
}

/**
 * Completes a booking payment with Stripe transaction ID
 * @param bookingId The ID of the booking to complete
 * @param finalPaymentTransactionId The Stripe transaction ID for the final payment
 * @returns Response with updated booking data
 */
export async function completeStripeBooking(
  bookingId: string,
  finalPaymentTransactionId: string
): Promise<CompleteBookingResponse> {
  try {
    const response = await fetch(
      `/api/v1/bookings/${bookingId}/complete-stripe`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Important for sending cookies for authentication
        body: JSON.stringify({ finalPaymentTransactionId }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to complete booking payment");
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("An unexpected error occurred while completing the payment");
  }
}