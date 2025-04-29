// app/organization/[id]/view-turfs/[turfId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  FiMapPin,
  FiClock,
  FiUsers,
  FiArrowLeft,
  FiDollarSign,
  FiPhone,
  FiMail,
  FiStar,
  FiHome,
} from "react-icons/fi";
import { fetchTurfById } from "@/lib/server-apis/view-turfs/fetchTurfbyId-api";
import { ITurf } from "@/types/turf";
import { generateBariKoiMapLink } from "@/lib/server-apis/BariKoi/generateBariKoiMapLink-api";

// Days of the week for operating hours
const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function TurfDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id: organizationId, turfId } = params;

  const [turf, setTurf] = useState<ITurf | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [today] = useState(new Date().getDay());

  useEffect(() => {
    const loadTurf = async () => {
      try {
        setLoading(true);
        if (turfId) {
          const turfData = await fetchTurfById(turfId as string);
          setTurf(turfData);
        }
      } catch (error) {
        console.error("Error loading turf:", error);
        toast.error("Failed to load turf details");
      } finally {
        setLoading(false);
      }
    };

    loadTurf();
  }, [turfId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="animate-spin rounded-full h-14 w-14 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!turf) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-gray-600">
        <p className="text-lg">Turf Not Found</p>
        <button
          onClick={() => router.back()}
          className="mt-4 flex items-center gap-2 text-blue-600 hover:underline"
        >
          <FiArrowLeft /> Go Back
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 py-10"
    >
      {/* Breadcrumb navigation */}
      <nav className="flex items-center text-sm text-gray-500 mb-6">
        <Link
          href="/organization/${orgId}"
          className="hover:text-blue-600 transition-colors"
        >
          <FiHome className="inline mr-1" /> Dashboard
        </Link>
        <span className="mx-2">/</span>
        <Link
          href={`/organization/${organizationId}/view-turf`}
          className="hover:text-blue-600 transition-colors"
        >
          Turfs
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">{turf.name}</span>
      </nav>

      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
      >
        <FiArrowLeft /> Back to Turfs
      </button>

      {/* Main content container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - Images and key info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Image gallery */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            {/* Main image */}
            <div className="relative h-96 w-full">
              <Image
                src={turf.images[activeImage] || "/placeholder-turf.jpg"}
                alt={turf.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 66vw"
              />
            </div>

            {/* Thumbnails */}
            {turf.images.length > 1 && (
              <div className="flex p-4 gap-2 overflow-x-auto">
                {turf.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`relative h-16 w-16 flex-shrink-0 rounded-md overflow-hidden border-2 transition-all ${
                      activeImage === idx
                        ? "border-blue-500 scale-105"
                        : "border-transparent"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${turf.name} thumbnail ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Turf details */}
          <div className="bg-white rounded-xl shadow p-6 space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">{turf.name}</h1>

            <div className="flex items-center text-gray-700">
              <FiMapPin className="mr-2 text-blue-600" />
              <p>
                {turf.organization.location.address},
                {turf.organization.location.area &&
                  ` ${turf.organization.location.area},`}
                {turf.organization.location.city}
              </p>
            </div>

            <div className="flex items-start gap-2">
              <FiClock className="mt-1 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Operating Hours</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  {turf.operatingHours.map((hours) => (
                    <div
                      key={hours.day}
                      className={`flex justify-between p-2 rounded ${
                        hours.day === today
                          ? "bg-blue-50 border-l-4 border-blue-500"
                          : ""
                      }`}
                    >
                      <span
                        className={hours.day === today ? "font-medium" : ""}
                      >
                        {DAYS[hours.day]}
                      </span>
                      <span>
                        {hours.open} - {hours.close}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <DetailItem
                icon={<FiUsers />}
                label="Team Size"
                value={`${turf.team_size} players per team`}
              />
              <DetailItem
                icon={<FiDollarSign />}
                label="Base Price"
                value={`৳${turf.basePrice}/hour`}
              />
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Sports Available
              </h3>
              <div className="flex flex-wrap gap-2">
                {turf.sports.map((sport, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-2 bg-blue-100 text-gray-800 font-medium rounded-full"
                  >
                    {sport}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4">
              {turf.organization.facilities &&
                turf.organization.facilities.length > 0 && (
                  <div className="mt-3">
                    <p className="text-gray-700 mb-2">Available Facilities:</p>
                    <div className="flex flex-wrap gap-2">
                      {turf.organization.facilities.map((facility, idx) => (
                        <span
                          key={idx}
                          className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-gray-800 text-sm rounded-full"
                        >
                          {facility}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* Right column - Contact and booking info */}
        <div className="space-y-6">
          {/* Contact info */}
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Contact Information
            </h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <FiPhone className="mt-1 mr-3 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="text-gray-900">
                    {turf.organization.orgContactPhone}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <FiMail className="mt-1 mr-3 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-gray-900">
                    {turf.organization.orgContactEmail}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <FiMapPin className="mt-1 mr-3 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="text-gray-900">
                    {turf.organization.location.address}
                  </p>
                  <p className="text-gray-900">
                    {turf.organization.location.city},{" "}
                    {turf.organization.location.post_code || ""}
                  </p>

                  {turf.organization.location.coordinates && (
                    <a
                      href={generateBariKoiMapLink(
                        turf.organization.location.coordinates.coordinates[1],
                        turf.organization.location.coordinates.coordinates[0]
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-blue-600 hover:underline text-sm"
                    >
                      <FiMapPin /> View on Barikoi Maps
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Reviews summary */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Reviews</h3>
              <span className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                <FiStar className="mr-1 text-yellow-500" />
                {turf.reviews.length} reviews
              </span>
            </div>
            {turf.reviews.length > 0 ? (
              <p className="text-gray-600">
                This turf has received {turf.reviews.length} reviews from users.
              </p>
            ) : (
              <p className="text-gray-600">No reviews yet for this turf.</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Utility component for detail items
const DetailItem = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
    <div className="text-blue-600">{icon}</div>
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  </div>
);
