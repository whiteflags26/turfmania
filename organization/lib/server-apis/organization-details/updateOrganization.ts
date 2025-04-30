import { IOrganization } from "@/types/organization";

export const updateOrganization = async (
  id: string, 
  formData: FormData
): Promise<IOrganization> => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/organizations/${id}`, 
      {
        method: "PUT",
        body: formData,
        credentials: "include", // Add this line to include cookies with the request
        headers: {
          // Don't set Content-Type header when sending FormData
          // The browser will set the correct content type with boundary
        }
      }
    );

    if (!response.ok) {
      const data = await response.json();
      console.error("Server response:", data);
      throw new Error(data.message || `Failed to update organization: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error updating organization:", error);
    throw error; // Re-throw the original error for better debugging
  }
};