"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { ITurfReview } from "@/types/turf-review";
import { IUser } from "@/types/user";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { fetchReviewsByTurf } from "@/lib/server-apis/single-turf/fetchReviewsByTurf-api";
import ReviewForm from "@/components/single-turf/ReviewForm";
import { motion, AnimatePresence } from "framer-motion";
import { Star } from "lucide-react";
import Image from "next/image";

interface ReviewSectionProps {
  turfId: string;
  currentUser: IUser | null;
}

interface ReviewData {
  reviews: ITurfReview[];
  averageRating: number;
  ratingDistribution: { [key: string]: number };
  pagination: {
    total: number;
    currentPage: number;
    totalPages: number;
    limit: number;
  };
}

export default function ReviewSection({
  turfId,
  currentUser,
}: ReviewSectionProps) {
  const [reviewData, setReviewData] = useState<ReviewData>({
    reviews: [],
    averageRating: 0,
    ratingDistribution: {},
    pagination: {
      total: 0,
      currentPage: 1,
      totalPages: 1,
      limit: 10,
    },
  });
  const [sortBy, setSortBy] = useState("latest");
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const router = useRouter();

  // Convert rating distribution to chart data
  const distributionData = Object.entries(reviewData.ratingDistribution)
    .map(([star, count]) => ({
      star: Number(star),
      count: Number(count),
    }))
    .sort((a, b) => b.star - a.star);

  const loadReviews = async () => {
    try {
      const options = {
        page: reviewData.pagination.currentPage,
        limit: 10,
        sortBy:
          sortBy === "latest"
            ? "createdAt"
            : sortBy === "oldest"
            ? "createdAt"
            : "rating",
        sortOrder:
          sortBy === "oldest"
            ? ("asc" as const)
            : sortBy === "lowest"
            ? ("asc" as const)
            : ("desc" as const),
        minRating: filterRating || undefined,
        maxRating: filterRating || undefined,
      };

      const data = await fetchReviewsByTurf(turfId, options);
      setReviewData(data);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [turfId, sortBy, filterRating, reviewData.pagination.currentPage]);

  const handlePageChange = (newPage: number) => {
    setReviewData((prev) => ({
      ...prev,
      pagination: { ...prev.pagination, currentPage: newPage },
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Header with Add Review Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold tracking-tight">
          Reviews & Ratings
        </h2>
        {currentUser ? (
          <Dialog>
            <DialogTrigger asChild>
              <Button className='rounded-xl' >
                Add Your Review
              </Button>
            </DialogTrigger>
            <DialogContent>
              <ReviewForm turfId={turfId} onSuccess={loadReviews} />
            </DialogContent>
          </Dialog>
        ) : (
          <Button
            onClick={() => router.push("/sign-in")}
          >
            Sign in to Review
          </Button>
        )}
      </div>

      {/* Rating Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-5xl font-bold text-slate-900 mb-2">
                {reviewData.averageRating.toFixed(1)}
              </p>
              <div className="flex justify-center gap-1 mb-2">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.round(reviewData.averageRating)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-slate-200"
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-slate-500">
                Based on {reviewData.pagination.total} reviews
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-slate-200">
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={distributionData}>
                <XAxis
                  dataKey="star"
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#16a34a"
                  radius={[4, 4, 0, 0]}
                  barSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex items-center gap-3">
              <Label className="text-slate-700">Sort by:</Label>
              <select
                className="px-3 py-2 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="latest">Latest</option>
                <option value="oldest">Oldest</option>
                <option value="highest">Highest Rated</option>
                <option value="lowest">Lowest Rated</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <Label className="text-slate-700">Filter by rating:</Label>
              <select
                className="px-3 py-2 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                value={filterRating || ""}
                onChange={(e) =>
                  setFilterRating(
                    e.target.value ? Number(e.target.value) : null
                  )
                }
              >
                <option value="">All Ratings</option>
                {[5, 4, 3, 2, 1].map((star) => (
                  <option key={star} value={star}>
                    {star} Stars
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="space-y-4"
        >
          {reviewData.reviews.length === 0 ? (
            <Card className="border-slate-200">
              <CardContent className="p-8 text-center">
                <Star className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-600">No reviews found.</p>
              </CardContent>
            </Card>
          ) : (
            reviewData.reviews.map((review) => (
              <motion.div
                key={review._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border-slate-200 hover:border-green-600 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {review.user?.first_name} {review.user?.last_name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.review && (
                      <p className="text-slate-600 text-sm leading-relaxed mb-4">
                        {review.review}
                      </p>
                    )}
                    {review.images && review.images.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {review.images.map((img, i) => (
                          <div key={i} className="relative h-24 w-full">
                            <Image
                              src={img}
                              alt={`Review image ${i + 1}`}
                              fill
                              sizes="(max-width: 768px) 50vw, 25vw"
                              className="object-cover rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </motion.div>
      </AnimatePresence>

      {/* Pagination */}
      {reviewData.pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: reviewData.pagination.totalPages }, (_, i) => (
            <Button
              key={i}
              variant={
                reviewData.pagination.currentPage === i + 1
                  ? "default"
                  : "outline"
              }
              className={
                reviewData.pagination.currentPage === i + 1
                  ? "bg-green-600 hover:bg-green-700"
                  : "hover:border-green-600 hover:text-green-600"
              }
              onClick={() => handlePageChange(i + 1)}
            >
              {i + 1}
            </Button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
