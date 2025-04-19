import { ITurfReview } from "@/types/turf-review";

export async function fetchReviewsByTurf(turfId: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/turf-review/turf/${turfId}`,
      { cache: "no-store" }
    );

    if (!res.ok) throw new Error("Failed to fetch reviews");
    const json = await res.json();
    return json.data.reviews as ITurfReview[];
  } catch (error) {
    console.error(error);
    return [];
  }
}
