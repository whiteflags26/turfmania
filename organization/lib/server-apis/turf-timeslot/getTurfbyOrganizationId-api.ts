import { ApiResponse, Turf } from "@/types/timeslot";

export async function fetchTurfsByOrganizationId(
  organizationId: string
): Promise<ApiResponse<Turf[]>> {
  try {

    const response = await fetch(
      `/api/v1/turf/organization/${organizationId}`
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
