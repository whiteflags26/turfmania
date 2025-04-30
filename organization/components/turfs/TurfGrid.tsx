import React from "react";
import { ITurf } from "@/types/turf";
import TurfCard from "@/components/turfs/TurfCard";

interface TurfGridProps {
  turfs: ITurf[];
  loading?: boolean;
}

const TurfGrid: React.FC<TurfGridProps> = ({ turfs, loading = false }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={`skeleton-${i}`}
            className="bg-white rounded-xl shadow-md overflow-hidden h-80"
          >
            <div className="h-48 bg-gray-200 animate-pulse"></div>
            <div className="p-5 space-y-4">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
              <div className="flex gap-2">
                <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (turfs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <svg
          className="w-16 h-16 mb-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"
          ></path>
        </svg>
        <h3 className="text-xl font-medium mb-1">No turfs found</h3>
        <p className="text-gray-500">
          This organization hasn't added any turfs yet.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {turfs.map((turf) => (
        <TurfCard key={turf._id} turf={turf} />
      ))}
    </div>
  );
};

export default TurfGrid;
