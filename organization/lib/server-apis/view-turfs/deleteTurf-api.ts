export const deleteTurf = async (turfId: string): Promise<void> => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/turf/${turfId}`,
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