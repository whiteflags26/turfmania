import { ApiResponse } from "@/types/timeslot";

interface GenerateTimeslotsParams {
  turfId: string;
  startDate: string;
  endDate: string;
  slotDuration: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export async function generateTimeSlots(
  params: GenerateTimeslotsParams
): Promise<ApiResponse<any>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/timeslot/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        turfId: params.turfId,
        startDate: params.startDate,
        endDate: params.endDate,
        slotDuration: params.slotDuration,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.message || "Failed to generate timeslots");
    }

    return await response.json();
  } catch (error) {
    console.error("Error generating timeslots:", error);
    throw error;
  }
}

export async function getAvailableTimeSlots(
  turfId: string,
  date: Date
): Promise<ApiResponse<any>> {
  try {
    const dateStr = date.toISOString().split("T")[0];
    const response = await fetch(
      `${API_BASE_URL}/api/v1/timeslot/available/${turfId}?date=${dateStr}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch available timeslots");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching timeslots:", error);
    throw error;
  }
}
