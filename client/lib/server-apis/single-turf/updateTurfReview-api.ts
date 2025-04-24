export async function updateTurfReview(
  reviewId: string,
  formData: FormData,
  token: string
) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/turf-review/review/${reviewId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Failed to update review");
    }

    return await res.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}
