import { IFacility } from "@/types/facility";

export const fetchFacilities = async (): Promise<IFacility[]> => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/facilities`
    );
    const data = await response.json();

    if (response.ok) {
      return data.data;
    } else {
      throw new Error(data.message || "Failed to fetch facilities");
    }
  } catch (error) {
    console.error("Error fetching facilities:", error);
    throw new Error("Failed to load facilities");
  }
};
