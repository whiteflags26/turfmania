import { ITurf } from "@/types/turf";
import axios from "axios";

export const fetchTurfById = async (turfId: string): Promise<ITurf> => {
  try {
    const response = await axios.get<{ success: boolean; data: ITurf }>(
      `/api/v1/turf/${turfId}`
    );
    return response.data.data;
  } catch (error) {
    console.error("Error fetching turf details:", error);
    throw error;
  }
};
