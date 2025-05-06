import axios from "axios";
import { CompleteBookingResponse } from "@/types/bookingPageTypes";

/**
 * Completes a booking with cash payment
 * @param bookingId The ID of the booking to complete
 * @param organizationId The ID of the organization that owns the turf
 * @returns Promise with updated booking data
 */
export async function completeCashBooking(
  bookingId: string,
  organizationId: string
): Promise<CompleteBookingResponse> {
  try {
    // Add organization context as query parameter for permission check
    const queryParams = new URLSearchParams();
    queryParams.append("organizationId", organizationId);

    const response = await axios.put(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/bookings/${bookingId}/complete-cash?${queryParams.toString()}`,
      {}, // Empty object as body
      { withCredentials: true } // Include cookies for authentication
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.error ||
          "Failed to complete booking with cash payment"
      );
    }
    throw error;
  }
}
