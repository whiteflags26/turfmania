import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/router";
import { ITurfReview } from "@/types/turf-review";
import { IUser } from "@/types/user";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { fetchReviewsByTurf } from "@/lib/server-apis/single-turf/fetchReviewsByTurf-api";
import { fetchTurfReviewSummary } from "@/lib/server-apis/single-turf/turfReviewSummary-api";

interface ReviewSectionProps {
  turfId: string;
  currentUser: IUser | null;
}

export default function ReviewSection({ turfId, currentUser }: ReviewSectionProps) {
  const [reviews, setReviews] = useState<ITurfReview[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [ratingSummary, setRatingSummary] = useState<{ averageRating: number; reviewCount: number }>({
    averageRating: 0,
    reviewCount: 0,
  });
  const [ratingDistribution, setRatingDistribution] = useState<{ star: number; count: number }[]>([]);
  const [sortBy, setSortBy] = useState("latest");
  const [filterRating, setFilterRating] = useState<number | null>(null);

  const router = useRouter();

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/turf-review/summary/${turfId}`);
        const json = await res.json();
        setRatingSummary(json.data || { averageRating: 0, reviewCount: 0 });

        const distribution = Object.entries(json.data.ratingDistribution || {}).map(([star, count]) => ({
          star: Number(star),
          count: Number(count),
        }));
        setRatingDistribution(distribution);
      } catch (error) {
        console.error("Failed to load rating summary.", error);
      }
    };
    loadSummary();
  }, [turfId]);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/turf-review/turf/${turfId}?page=${page}&sort=${sortBy}${filterRating ? `&rating=${filterRating}` : ""}`
        );
        const json = await res.json();
        setReviews(json.data.reviews);
        setTotalPages(json.data.totalPages);
      } catch (error) {
        console.error("Error fetching reviews.", error);
      }
    };
    loadReviews();
  }, [page, sortBy, filterRating, turfId]);

  return (
    <div className="my-12 p-4 rounded-2xl shadow-md bg-white">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Reviews & Ratings</h2>
        {currentUser ? (
          <Dialog>
            <DialogTrigger asChild>
              <Button>Add Your Review</Button>
            </DialogTrigger>
            <DialogContent>
              <ReviewForm turfId={turfId} onSuccess={() => setPage(1)} />
            </DialogContent>
          </Dialog>
        ) : (
          <Button onClick={() => router.push("/sign-in")}>Add Your Review</Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-4">
            <p className="text-4xl font-bold">{ratingSummary.averageRating.toFixed(1)}</p>
            <p className="text-gray-500">Average Rating</p>
            <p className="text-sm text-gray-400">{ratingSummary.reviewCount} Reviews</p>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardContent className="p-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ratingDistribution.sort((a, b) => b.star - a.star)}>
                <XAxis dataKey="star" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="space-x-2">
          <Label>Sort by:</Label>
          <select
            className="border rounded p-1 text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="latest">Latest</option>
            <option value="oldest">Oldest</option>
            <option value="highest">Highest Rated</option>
            <option value="lowest">Lowest Rated</option>
          </select>
        </div>
        <div className="space-x-2">
          <Label>Filter by rating:</Label>
          <select
            className="border rounded p-1 text-sm"
            value={filterRating || ""}
            onChange={(e) => setFilterRating(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">All</option>
            {[5,4,3,2,1].map(star => <option key={star} value={star}>{star} Star</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.length === 0 && <p className="text-gray-500">No reviews found.</p>}
        {reviews.map((review) => (
          <Card key={review._id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold">{review.user?.first_name} {review.user?.last_name}</p>
                  <p className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span
                      key={i}
                      className={`text-lg ${i < review.rating ? "text-yellow-400" : "text-gray-300"}`}
                    >★</span>
                  ))}
                </div>
              </div>
              <p className="mb-2 text-sm">{review.review}</p>
              {review.images?.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {review.images.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt={`review-img-${i}`}
                      className="h-24 w-24 object-cover rounded-lg"
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => (
            <Button
              key={i}
              variant={page === i + 1 ? "default" : "outline"}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewForm({ turfId, onSuccess }: { turfId: string; onSuccess: () => void }) {
  const [review, setReview] = useState("");
  const [rating, setRating] = useState(5);
  const [images, setImages] = useState<File[]>([]);

  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append("rating", rating.toString());
    formData.append("review", review);
    images.forEach((file) => formData.append("images", file));

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/turf-review/review/`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to post review");
      onSuccess();
    } catch (error) {
      console.error("Error submitting review:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Rating</Label>
        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="w-full border rounded p-2"
        >
          {[5,4,3,2,1].map((star) => (
            <option key={star} value={star}>{star} Star</option>
          ))}
        </select>
      </div>
      <div>
        <Label>Review</Label>
        <Input
          type="text"
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Write your review here..."
        />
      </div>
      <div>
        <Label>Upload Images</Label>
        <Input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => setImages(Array.from(e.target.files || []))}
        />
      </div>
      <Button className="w-full" onClick={handleSubmit}>Submit Review</Button>
    </div>
  );
}
