import axios from "axios";
import { MonthlyEarningResponse } from "@/types/bookingPageTypes";

/**
 * Fetches monthly earnings for a turf for the current year
 * @param turfId The ID of the turf to fetch earnings for
 * @param organizationId The ID of the organization that owns the turf
 * @returns Promise with monthly earnings data
 */
export async function fetchTurfMonthlyEarnings(
  turfId: string,
  organizationId: string
): Promise<MonthlyEarningResponse> {
  try {
    // Add organization context as query parameter for permission check
    const queryParams = new URLSearchParams();
    queryParams.append("organizationId", organizationId);

    const response = await axios.get(
      `/api/v1/bookings/turf/${turfId}/monthly-earnings?${queryParams.toString()}`,
      { withCredentials: true } // Include cookies for authentication
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.error || "Failed to fetch turf monthly earnings"
      );
    }
    throw error;
  }
}
