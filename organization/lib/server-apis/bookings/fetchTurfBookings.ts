import axios from "axios";
import {
  BookingsResponse,
  BookingFilters,
  PaginationParams,
} from "@/types/bookingPageTypes";

/**
 * Fetches bookings for a specific turf with optional filtering and pagination
 * @param turfId The ID of the turf to fetch bookings for
 * @param organizationId The ID of the organization that owns the turf
 * @param filters Optional filtering parameters
 * @param pagination Optional pagination parameters
 * @returns Promise with booking data
 */
export async function fetchTurfBookings(
  turfId: string,
  organizationId: string,
  filters: BookingFilters = {},
  pagination: PaginationParams = { page: 1, limit: 10 }
): Promise<BookingsResponse> {
  try {
    // Build query parameters
    const queryParams = new URLSearchParams();
    
    // Add organization context for permission check
    queryParams.append("organizationId", organizationId);

    // Add pagination
    if (pagination.page) queryParams.append("page", pagination.page.toString());
    if (pagination.limit)
      queryParams.append("limit", pagination.limit.toString());

    // Add filters
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        queryParams.append("status", filters.status.join(","));
      } else {
        queryParams.append("status", filters.status);
      }
    }

    if (filters.fromDate) queryParams.append("fromDate", filters.fromDate);
    if (filters.toDate) queryParams.append("toDate", filters.toDate);
    if (filters.isPaid !== undefined)
      queryParams.append("isPaid", filters.isPaid.toString());
    if (filters.sortBy) queryParams.append("sortBy", filters.sortBy);
    if (filters.sortOrder) queryParams.append("sortOrder", filters.sortOrder);

    const response = await axios.get(
      `${
        process.env.NEXT_PUBLIC_API_URL
      }/api/v1/bookings/turf/${turfId}?${queryParams.toString()}`,
      { withCredentials: true } // Include cookies for authentication
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.error || "Failed to fetch turf bookings"
      );
    }
    throw error;
  }
}
