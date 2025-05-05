import { ITurf } from "@/types/turf";

export const createTurf = async (organizationId: string, formData: FormData): Promise<ITurf> => {
  try {
    // Make sure we're sending organizationId in the correct format the server expects
    // The server expects a field named "organization" with just the ID string
    // formData.append('organization', organizationId);    
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/turf`,
      {
        method: "POST",
        body: formData,
        credentials: 'include',
      }
    );
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to create turf");
    }
    
    const responseData = await res.json();
    return responseData.data;
  } catch (error) {
    console.error("API Error creating turf:", error);
    throw error;
  }
};