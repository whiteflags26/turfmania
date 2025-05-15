import { ITurf } from "@/types/turf";

export const createTurf = async (organizationId: string, formData: FormData): Promise<ITurf> => {
  try {   
    const res = await fetch(
      `/api/v1/turf`,
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