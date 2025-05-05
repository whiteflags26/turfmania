import { ITurf } from "@/types/turf";

export const updateTurf = async (
  id: string,
  formData: FormData
): Promise<ITurf> => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/turf/${id}`,
    {
      method: "PUT",
      body: formData,
      credentials: 'include',
    }
  );
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to update turf");
  }
  
  const responseData = await res.json();
  return responseData.data; // Access the 'data' property from the response
};