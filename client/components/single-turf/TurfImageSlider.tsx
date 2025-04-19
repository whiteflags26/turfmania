
"use client"
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/utils";

interface TurfImageSliderProps {
  images: string[];
}

const TurfImageSlider: React.FC<TurfImageSliderProps> = ({ images }) => {
  const [current, setCurrent] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const handleDotClick = (index: number) => setCurrent(index);

  const handleSwipe = (direction: "left" | "right") => {
    if (direction === "left") {
      setCurrent((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    } else {
      setCurrent((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    }
  };

  return (
    <div className="mt-9 relative w-full h-96 rounded-2xl overflow-hidden shadow-lg select-none">
      <AnimatePresence initial={false} mode="wait">
        <motion.img
          key={images[current]}
          src={images[current]}
          alt={`Turf Image ${current + 1}`}
          className="object-cover w-full h-full"
          initial={{ opacity: 0.6, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.6 }}
          onTouchStart={(e) =>
            (e.currentTarget.dataset.startX = String(e.touches[0].clientX))
          }
          onTouchEnd={(e) => {
            const startX = Number(e.currentTarget.dataset.startX);
            const diff = e.changedTouches[0].clientX - startX;
            if (Math.abs(diff) > 50) {
              handleSwipe(diff < 0 ? "left" : "right");
            }
          }}
        />
      </AnimatePresence>

      <div className="absolute bottom-4 w-full flex justify-center items-center gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => handleDotClick(index)}
            className={cn(
              "transition-all duration-300 rounded-full",
              index === current
                ? "bg-white w-3 h-3 shadow-md"
                : "bg-white/60 w-2 h-2"
            )}
          />
        ))}
      </div>
    </div>
  );
};

export default TurfImageSlider;
