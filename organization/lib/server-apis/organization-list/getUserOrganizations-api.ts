import { IOrganization } from "@/types/organization";

interface OrganizationResponse {
  success: boolean;
  count: number;
  data: IOrganization[];
}

export const getUserOrganizations = async (): Promise<OrganizationResponse> => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/organizations`,
      {
        credentials: "include", // Include cookies for authentication
      }
    );
    const data = await response.json();

    if (response.ok) {
      return data;
    } else {
      throw new Error(data.message || "Failed to fetch user organizations");
    }
  } catch (error) {
    console.error("Error fetching user organizations:", error);
    throw new Error("Failed to load organizations");
  }
};