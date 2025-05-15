export const deleteTurf = async (turfId: string): Promise<void> => {
  const res = await fetch(
    `/api/v1/turf/${turfId}`,
    {
      method: "DELETE",
      credentials: 'include',
    }
  );
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to delete turf");
  }
};