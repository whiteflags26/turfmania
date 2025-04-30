import axios from "axios";
import { ITurf } from "@/types/turf";

interface TurfsResponse {
  success: boolean;
  count: number;
  data: ITurf[];
}

export const fetchTurfsByOrganization = async (
  organizationId: string
): Promise<ITurf[]> => {
  try {
    const response = await axios.get<TurfsResponse>(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/turf/organization/${organizationId}`
    );
    return response.data.data;
  } catch (error) {
    console.error("Error fetching turfs:", error);
    throw error;
  }
};
