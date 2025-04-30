import { IOrganization } from "@/types/organization";

export const fetchOrganization = async (id: string): Promise<IOrganization> => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/organizations/${id}`
    );
    const data = await response.json();

    if (response.ok) {
      return data.data;
    } else {
      throw new Error(data.message || "Failed to fetch organization");
    }
  } catch (error) {
    console.error("Error fetching organization:", error);
    throw new Error("Failed to load organization data");
  }
};
