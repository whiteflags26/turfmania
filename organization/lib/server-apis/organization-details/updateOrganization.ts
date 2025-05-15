import { IOrganization } from "@/types/organization";

export const updateOrganization = async (
  id: string, 
  formData: FormData
): Promise<IOrganization> => {
  try {
    const response = await fetch(
      `/api/v1/organizations/${id}`, 
      {
        method: "PUT",
        body: formData,
        credentials: "include", // Add this line to include cookies with the request
      }
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || `Failed to update organization: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error updating organization:", error);
    throw error; // Re-throw the original error for better debugging
  }
};