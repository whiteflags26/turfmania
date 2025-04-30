import { ITimeSlot } from "@/types/timeslot";
import { format } from "date-fns";
import Cookies from "js-cookie";

interface FetchAvailableTimeSlotsResponse {
  success: boolean;
  data: ITimeSlot[];
}

export const fetchAvailableTimeSlots = async (
  turfId: string,
  selectedDate: Date
): Promise<FetchAvailableTimeSlotsResponse> => {
  try {
    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    const token = Cookies.get("token") || localStorage.getItem("token");

    if (!token) {
      console.error("No authentication token found");
      return {
        success: false,
        data: [],
      };
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/timeslot/available/${turfId}?date=${formattedDate}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: "include", // This will send cookies automatically
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("API response error:", errorData);
      return {
        success: false,
        data: [],
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching time slots:", error);
    return {
      success: false,
      data: [],
    };
  }
};
