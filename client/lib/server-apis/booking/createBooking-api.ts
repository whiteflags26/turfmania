import { IBooking } from "@/types/booking";

interface CreateBookingParams {
  turfId: string;
  timeSlotIds: string[];
  advancePaymentTransactionId: string;
}

interface CreateBookingResponse {
  success: boolean;
  data: IBooking;
  message: string;
}

/**
 * Creates a booking for selected time slots
 * @param bookingData The booking data including turf, time slots and payment info
 * @returns Response with booking data or error
 */
export async function createBooking(
  bookingData: CreateBookingParams
): Promise<CreateBookingResponse> {
  try {
    const response = await fetch(
      `/api/v1/bookings`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Important for sending cookies for authentication
        body: JSON.stringify(bookingData),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to create booking");
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("An unexpected error occurred while creating the booking");
  }
}