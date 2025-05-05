import axios from "axios";
import { CurrentMonthEarningResponse } from "@/types/bookingPageTypes";

/**
 * Fetches current month's earnings for a turf
 * @param turfId The ID of the turf to fetch earnings for
 * @param organizationId The ID of the organization that owns the turf
 * @returns Promise with current month earnings data
 */
export async function fetchTurfCurrentMonthEarnings(
  turfId: string,
  organizationId: string
): Promise<CurrentMonthEarningResponse> {
  try {
    // Add organization context as query parameter for permission check
    const queryParams = new URLSearchParams();
    queryParams.append("organizationId", organizationId);
    console.log("Query Params:", queryParams.toString()); // Debugging line

    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/bookings/turf/${turfId}/current-month-earnings?${queryParams.toString()}`,
      { withCredentials: true } // Include cookies for authentication
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.error ||
          "Failed to fetch turf current month earnings"
      );
    }
    throw error;
  }
}
