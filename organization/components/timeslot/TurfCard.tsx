import Image from 'next/image';
import { Turf } from '@/types/timeslot';
import { FiClock } from "react-icons/fi";

interface TurfCardProps {
  turf: Turf;
  isSelected: boolean;
  onSelect: () => void;
}

export default function TurfCard({ turf, isSelected, onSelect }: TurfCardProps) {
  const firstImage = turf.images.length > 0 ? turf.images[0] : '/placeholder-turf.jpg';

  return (
    <div
      className={`relative overflow-hidden rounded-xl transition-all ${
        isSelected 
          ? 'ring-2 ring-blue-500 shadow-lg' 
          : 'hover:shadow-md border border-gray-200'
      }`}
      onClick={onSelect}
    >
      {/* Image */}
      <div className="relative h-48 w-full">
        <Image
          src={firstImage}
          alt={turf.name}
          fill
          className="object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder-turf.jpg';
          }}
        />
        {isSelected && (
          <div className="absolute inset-0 bg-blue-500/10 "></div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-lg text-gray-900">{turf.name}</h3>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-medium">
            ${turf.basePrice}/hr
          </span>
        </div>

        <p className="text-gray-600 text-sm mt-1">{turf.organization.name}</p>

        {/* Sports */}
        <div className="mt-3 flex flex-wrap gap-1">
          {turf.sports.map((sport) => (
            <span
              key={sport}
              className="inline-block bg-gray-100 rounded-full px-2 py-1 text-xs font-medium text-gray-800"
            >
              {sport}
            </span>
          ))}
        </div>

        {/* Operating Hours */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FiClock className="text-gray-400" />
            <span>
              {turf.operatingHours[1]?.open} - {turf.operatingHours[1]?.close} (Weekdays)
            </span>
          </div>
        </div>
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
    </div>
  );
}