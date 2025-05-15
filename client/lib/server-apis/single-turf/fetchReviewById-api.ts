import { ITurfReview } from "@/types/turf-review";

export async function fetchReviewById(reviewId: string) {
  try {
    const res = await fetch(
      `/api/v1/turf-review/review/${reviewId}`,
      { cache: "no-store" }
    );

    if (!res.ok) throw new Error("Failed to fetch review");
    const json = await res.json();
    return json.data as ITurfReview;
  } catch (error) {
    console.error(error);
    return null;
  }
}
