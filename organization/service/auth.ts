import api from "@/lib/axios";
import { ApiResponse } from "@/types/api-response";
import { HasAccessRequest } from "@/types/organization";

export const hasOrgAccess = async (id: string) => {
  try {
    const { data } = await api.get<ApiResponse<HasAccessRequest>>(
      `/api/v1/users/organizations/${id}/check-access`
    );
    console.log(data.data.hasRole)
    return data.data.hasRole
  } catch (error) {
    console.error("Organization access check failed:", error);
    // Return a default response indicating no access
    return false;
  }
};
