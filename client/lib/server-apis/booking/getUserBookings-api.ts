import { IBooking } from "@/types/booking";

interface BookingsResponse {
  success: boolean;
  data: IBooking[];
  meta: {
    total: number;
    page: number;
    pages: number;
    filters: string[];
  };
}

interface GetUserBookingsParams {
  page?: number;
  limit?: number;
  status?: string | string[];
  sortBy?: 'createdAt' | 'updatedAt' | 'totalAmount';
  sortOrder?: 'asc' | 'desc';
  fromDate?: string;
  toDate?: string;
  isPaid?: boolean;
}

/**
 * Fetches the current user's bookings
 * @param params Optional filtering and pagination parameters
 * @returns Response with user bookings data
 */
export async function getUserBookings(
  params: GetUserBookingsParams = {}
): Promise<BookingsResponse> {
  try {
    // Build query parameters
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status) {
      if (Array.isArray(params.status)) {
        queryParams.append('status', params.status.join(','));
      } else {
        queryParams.append('status', params.status);
      }
    }
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params.toDate) queryParams.append('toDate', params.toDate);
    if (params.isPaid !== undefined) queryParams.append('isPaid', params.isPaid.toString());
    
    const queryString = queryParams.toString();
    const endpoint = `/api/v1/bookings/user${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Important for sending cookies for authentication
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch user bookings");
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("An unexpected error occurred while fetching bookings");
  }
}