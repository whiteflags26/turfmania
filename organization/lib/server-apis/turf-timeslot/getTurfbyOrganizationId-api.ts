import { ApiResponse, Turf } from "@/types/timeslot";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchTurfsByOrganizationId(
  organizationId: string
): Promise<ApiResponse<Turf[]>> {
  try {

    const response = await fetch(
      `${API_BASE_URL}/api/v1/turf/organization/${organizationId}`
    );

    console.log(response);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching turfs:", error);
    throw error;
  }
}
