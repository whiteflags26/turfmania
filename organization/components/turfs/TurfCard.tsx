import { ITurf } from '@/types/turf';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { FiClock, FiMapPin, FiUsers } from 'react-icons/fi';

interface TurfCardProps {
  turf: ITurf;
  onDelete: (turfId: string) => Promise<void>;
}

const TurfCard: React.FC<TurfCardProps> = ({ turf, onDelete }) => {
  // Get today's operating hours
  const today = new Date().getDay(); // 0 = Sunday, 6 = Saturday
  const todayHours = turf.operatingHours.find(hours => hours.day === today);

  // Default image if none provided
  const defaultImage = '/placeholder-turf.jpg';
  const imageUrl =
    turf.images && turf.images.length > 0 ? turf.images[0] : defaultImage;

  return (
    <motion.div
      whileHover={{ y: -5 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden h-full flex flex-col"
    >
      <Link
        href={`/organization/${turf.organization._id}/view-turfs/${turf._id}`}
        className="block h-full"
      >
        <div className="relative h-48 w-full">
          <Image
            src={imageUrl}
            alt={turf.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <h3 className="text-white font-bold text-xl truncate">
              {turf.name}
            </h3>
          </div>
        </div>

        <div className="p-5 flex-grow flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center text-gray-700">
              <FiMapPin className="mr-2 text-blue-600 flex-shrink-0" />
              <p className="text-sm truncate">
                {turf.organization.location.address},{' '}
                {turf.organization.location.city}
              </p>
            </div>

            <div className="flex items-center text-gray-700">
              <FiClock className="mr-2 text-blue-600 flex-shrink-0" />
              <p className="text-sm">
                {todayHours
                  ? `Today: ${todayHours.open} - ${todayHours.close}`
                  : 'Closed today'}
              </p>
            </div>

            <div className="flex items-center text-gray-700">
              <FiUsers className="mr-2 text-blue-600 flex-shrink-0" />
              <p className="text-sm">{turf.team_size} players per team</p>
            </div>

            <div className="flex flex-wrap gap-2 mt-2">
              {turf.sports.map(sport => (
                <span
                  key={sport}
                  className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
                >
                  {sport}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs">Base Price</p>
              <p className="text-blue-600 font-bold text-lg">
                ৳{turf.basePrice.toLocaleString()}
                <span className="text-gray-500 text-xs font-normal">/hour</span>
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Details
            </motion.button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default TurfCard;
