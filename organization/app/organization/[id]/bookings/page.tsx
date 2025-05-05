"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import Link from "next/link";
import Image from "next/image";
import {
  FiBriefcase,
  FiCalendar,
  FiClock,
  FiDollarSign,
  FiFilter,
  FiMapPin,
  FiSearch,
  FiArrowRight,
  FiUsers,
  FiBarChart2,
} from "react-icons/fi";
import { fetchTurfsByOrganization } from "@/lib/server-apis/view-turfs/fetchTurfsbyOrganization-api";
import { fetchTurfCurrentMonthEarnings } from "@/lib/server-apis/bookings";
import { ITurf } from "@/types/turf";

export default function BookingsOverviewPage() {
  const { id: organizationId } = useParams();
  const router = useRouter();
  const [turfs, setTurfs] = useState<ITurf[]>([]);
  const [filteredTurfs, setFilteredTurfs] = useState<ITurf[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSport, setSelectedSport] = useState<string>("");
  const [organizationName, setOrganizationName] = useState("");
  const [turfEarnings, setTurfEarnings] = useState<Record<string, number>>({});

  // Get all available sports from the turfs
  const availableSports = [...new Set(turfs.flatMap((turf) => turf.sports))];

  useEffect(() => {
    const loadTurfs = async () => {
      try {
        setLoading(true);
        const fetchedTurfs = await fetchTurfsByOrganization(
          organizationId as string
        );
        setTurfs(fetchedTurfs);
        setFilteredTurfs(fetchedTurfs);

        // Set organization name if there are turfs
        if (fetchedTurfs.length > 0) {
          setOrganizationName(fetchedTurfs[0].organization.name);

          // Fetch earnings data for each turf
          const earningsData: Record<string, number> = {};
          await Promise.all(
            fetchedTurfs.map(async (turf) => {
              try {
                // Pass organizationId to the API function
                const earningsResponse = await fetchTurfCurrentMonthEarnings(
                  turf._id,
                  organizationId as string // Add organizationId parameter
                );
                earningsData[turf._id] = earningsResponse.data.earnings;
              } catch (error) {
                console.error(
                  `Error fetching earnings for turf ${turf._id}:`,
                  error
                );
                earningsData[turf._id] = 0;
              }
            })
          );

          setTurfEarnings(earningsData);
        }
      } catch (error) {
        console.error("Error loading turfs:", error);
        toast.error("Failed to load turfs");
      } finally {
        setLoading(false);
      }
    };

    if (organizationId) {
      loadTurfs();
    }
  }, [organizationId]);

  useEffect(() => {
    // Filter turfs based on search term and selected sport
    let filtered = [...turfs];

    if (searchTerm) {
      filtered = filtered.filter(
        (turf) =>
          turf.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          turf.organization.location.address
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    if (selectedSport) {
      filtered = filtered.filter((turf) => turf.sports.includes(selectedSport));
    }

    setFilteredTurfs(filtered);
  }, [searchTerm, selectedSport, turfs]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-6 py-10"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Booking Management
          </h1>
          {organizationName && (
            <div className="flex items-center mt-2 text-gray-600">
              <FiBriefcase className="mr-2" />
              <span>{organizationName}</span>
            </div>
          )}
          <p className="mt-2 text-gray-500 max-w-2xl">
            Manage bookings for all your turfs. View booking details, complete
            cash payments, and track earnings.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="rounded-md bg-blue-50 p-3 border border-blue-100">
            <div className="flex items-center">
              <FiCalendar className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <div className="text-xs text-gray-500">Current Month</div>
                <div className="font-semibold text-blue-700">
                  {new Date().toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by turf name or location..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 sm:text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="w-full md:w-48">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiFilter className="text-gray-400" />
              </div>
              <select
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 sm:text-sm"
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
              >
                <option value="">All Sports</option>
                {availableSports.map((sport) => (
                  <option key={sport} value={sport}>
                    {sport}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Turfs Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow animate-pulse h-80"
            ></div>
          ))}
        </div>
      ) : filteredTurfs.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <FiCalendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No turfs found</h3>
          <p className="mt-2 text-gray-500">
            No turfs match your search criteria or no turfs are available.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTurfs.map((turf) => (
            <motion.div
              key={turf._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl shadow overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Turf Image */}
              <div className="relative h-48 w-full">
                <Image
                  src={turf.images[0] || "/placeholder-turf.jpg"}
                  alt={turf.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute top-3 right-3 bg-white rounded-lg py-1 px-2 shadow">
                  <div className="flex items-center gap-1 text-xs font-medium">
                    <FiDollarSign className="text-green-600" />
                    <span className="text-gray-900">৳{turf.basePrice}/hr</span>
                  </div>
                </div>
              </div>

              {/* Turf Details */}
              <div className="p-4">
                {/* Turf Name and Location */}
                <div className="mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {turf.name}
                  </h3>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <FiMapPin className="mr-1 flex-shrink-0 h-4 w-4" />
                    <span className="truncate">
                      {turf.organization.location.address}
                    </span>
                  </div>
                </div>

                {/* Key Info */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-gray-50">
                    <div className="text-xs text-gray-500">Team Size</div>
                    <div className="flex items-center mt-1">
                      <FiUsers className="h-3 w-3 text-blue-600 mr-1" />
                      <span className="text-sm font-medium">
                        {turf.team_size}v{turf.team_size}
                      </span>
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-gray-50">
                    <div className="text-xs text-gray-500">
                      Current Earnings
                    </div>
                    <div className="flex items-center mt-1">
                      <FiBarChart2 className="h-3 w-3 text-green-600 mr-1" />
                      <span className="text-sm font-medium">
                        ৳{turfEarnings[turf._id]?.toFixed(2) || "0.00"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sports Tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {(turf.sports || []).slice(0, 3).map((sport) => (
                    <span
                      key={sport}
                      className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full"
                    >
                      {sport}
                    </span>
                  ))}
                  {(turf.sports || []).length > 3 && (
                    <span className="text-xs bg-gray-50 text-gray-700 px-2 py-1 rounded-full">
                      +{turf.sports.length - 3} more
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-1 flex gap-2">
                  <Link
                    href={`/organization/${organizationId}/view-turfs/${turf._id}`}
                    className="flex-1 py-2 px-3 text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-center transition"
                  >
                    View Details
                  </Link>
                  <Link
                    href={`/organization/${organizationId}/bookings/${turf._id}`}
                    className="flex-1 py-2 px-3 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-1 transition"
                  >
                    <span>Manage Bookings</span>
                    <FiArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* No turfs message */}
      {!loading && turfs.length === 0 && (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <FiCalendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">
            No turfs available
          </h3>
          <p className="mt-2 text-gray-500">
            This organization doesn't have any turfs yet.
          </p>
        </div>
      )}
    </motion.div>
  );
}
