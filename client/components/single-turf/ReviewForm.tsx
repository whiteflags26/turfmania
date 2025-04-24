"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DialogTitle } from "@/components/ui/dialog";
import { Star } from "lucide-react";
import { motion } from "framer-motion";

export default function ReviewForm({ turfId, onSuccess }: { turfId: string; onSuccess: () => void }) {
  const [review, setReview] = useState("");
  const [rating, setRating] = useState(5);
  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("turfId", turfId);
    formData.append("rating", rating.toString());
    formData.append("review", review);
    images.forEach((file) => formData.append("images", file));

    try {
      const res = await fetch("/api/v1/turf-review/review/", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to post review");
      onSuccess();
    } catch (error) {
      console.error("Error submitting review:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 p-4"
    >
      <DialogTitle className="text-xl font-semibold mb-4">
        Write a Review
      </DialogTitle>

      <div className="space-y-2">
        <Label className="text-base">Rating</Label>
        <div className="flex gap-2">
          {[5, 4, 3, 2, 1].map((star) => (
            <motion.button
              key={star}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setRating(star)}
              className="focus:outline-none"
            >
              <Star
                className={`h-8 w-8 ${
                  star <= rating
                    ? "text-yellow-400 fill-current"
                    : "text-gray-300"
                }`}
              />
            </motion.button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-base">Your Review</Label>
        <Textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Share your experience..."
          className="min-h-[100px] resize-none"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-base">Upload Images</Label>
        <Input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => setImages(Array.from(e.target.files || []))}
          className="cursor-pointer file:cursor-pointer file:border-0 file:bg-primary/10 file:text-primary file:font-medium file:mr-4 file:py-2 file:px-4 hover:file:bg-primary/20"
        />
        <p className="text-sm text-gray-500">You can upload multiple images</p>
      </div>

      <Button 
        className="w-full"
        onClick={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Submitting..." : "Submit Review"}
      </Button>
    </motion.div>
  );
}