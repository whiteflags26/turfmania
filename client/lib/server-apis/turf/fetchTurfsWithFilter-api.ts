import axios from "axios";
import { TeamSize, Sport, Facility } from "@/types/turfFilterData";

/**
 * Fetch all team sizes from the API
 */
export const fetchTeamSizes = async (): Promise<TeamSize[]> => {
  const response = await axios.get(`/api/v1/team-sizes/`);
  if (response.data.success) {
    return response.data.data;
  }
  return [];
};

/**
 * Fetch all sports from the API
 */
export const fetchSports = async (): Promise<Sport[]> => {
  const response = await axios.get(`/api/v1/sports/`);
  if (response.data.success) {
    return response.data.data;
  }
  return [];
};

/**
 * Fetch all facilities from the API
 */
export const fetchFacilities = async (): Promise<Facility[]> => {
  const response = await axios.get(`/api/v1/facilities/`);
  if (response.data.success) {
    return response.data.data;
  }
  return [];
};

/**
 * Fetch all filter data (team sizes, sports, facilities) in parallel
 */
export const fetchAllFilterData = async (): Promise<{
  teamSizes: TeamSize[];
  sports: Sport[];
  facilities: Facility[];
}> => {
  try {
    const [teamSizes, sports, facilities] = await Promise.all([
      fetchTeamSizes(),
      fetchSports(),
      fetchFacilities()
    ]);

    return { teamSizes, sports, facilities };
  } catch (error) {
    console.error("Error fetching filter data:", error);
    return { teamSizes: [], sports: [], facilities: [] };
  }
};