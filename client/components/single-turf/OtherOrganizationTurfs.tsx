"use client";

import { ITurf } from "@/types/turf";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface OtherOrganizationTurfsProps {
  turfs: ITurf[];
  currentTurfId: string;
}

export default function OtherOrganizationTurfs({
  turfs,
  currentTurfId,
}: OtherOrganizationTurfsProps) {
  const filteredTurfs = turfs.filter((turf) => turf._id !== currentTurfId);
  const [showAll, setShowAll] = useState(false);

  if (filteredTurfs.length === 0) return null;

  const turfsToShow = showAll ? filteredTurfs : filteredTurfs.slice(0, 3);

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Other Turfs by this Organization
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {turfsToShow.map((turf) => (
          <Card
            key={turf._id}
            className="hover:shadow-lg transition rounded-2xl overflow-hidden"
          >
            <Link href={`/venues/${turf._id}`}>
              <div className="relative h-48 w-full">
                <Image
                  src={turf.images[0] || "/no-image.jpg"}
                  alt={turf.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {turf.name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {turf.organization?.location?.address ||
                    "Address Unavailable"}
                </p>
                <p className="text-sm text-gray-800 mt-2 font-medium">
                  ৳ {turf.basePrice.toFixed(2)} / hour
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {turf.sports.map((sport) => (
                    <span
                      key={sport}
                      className="bg-emerald-100 text-emerald-700 text-xs font-medium px-2 py-1 rounded-full"
                    >
                      {sport}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>

      {filteredTurfs.length > 3 && (
        <div className="flex justify-center mt-8">
          <Button
            onClick={() => setShowAll((prev) => !prev)}
            className="px-6 py-2 rounded-full text-sm"
            variant="outline"
          >
            {showAll ? "Show Less" : "Show More"}
          </Button>
        </div>
      )}
    </section>
  );
}
