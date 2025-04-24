"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DialogTitle } from "@/components/ui/dialog";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { createTurfReview } from "@/lib/server-apis/single-turf/createTurfReview-api";
import toast from "react-hot-toast";

interface ReviewFormProps {
  turfId: string;
  onSuccess: () => void;
}

export default function ReviewForm({ turfId, onSuccess }: ReviewFormProps) {
  const [review, setReview] = useState("");
  const [rating, setRating] = useState(5);
  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 2) {
      toast.error("Maximum 2 images allowed");
      return;
    }
    setImages(files);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Validate rating
      if (!rating) {
        toast.error("Rating is required");
        return;
      }

      // Create FormData
      const formData = new FormData();
      formData.append("turfId", turfId);
      formData.append("rating", rating.toString());
      
      // Add optional fields
      if (review.trim()) {
        formData.append("review", review.trim());
      }
      
      // Add images if any
      images.forEach((file) => {
        formData.append("images", file);
      });

      await createTurfReview(formData);
      
      toast.success("Review submitted successfully!");
      onSuccess();
      
      // Reset form
      setReview("");
      setRating(5);
      setImages([]);
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit review");
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
        <Label className="text-base">Rating (Required)</Label>
        <div className="flex gap-2">
          {[1,2,3,4,5].map((star) => (
            <motion.button
              type="button"
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
        <Label className="text-base">Your Review (Optional)</Label>
        <Textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Share your experience..."
          className="min-h-[100px] resize-none"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-base">Upload Images (Optional)</Label>
        <Input
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageChange}
          className="cursor-pointer file:cursor-pointer file:border-0 file:bg-primary/10 file:text-primary file:font-medium file:mr-4 file:py-2 file:px-4 hover:file:bg-primary/20"
        />
        <p className="text-sm text-gray-500">Maximum 2 images allowed</p>
      </div>

      <Button 
        onClick={handleSubmit}
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Submitting..." : "Submit Review"}
      </Button>
    </motion.div>
  );
}