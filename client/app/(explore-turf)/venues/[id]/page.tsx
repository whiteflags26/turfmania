"use client";

import { ITurf } from "@/types/turf";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { fetchSingleTurf } from "@/lib/server-apis/single-turf/single-turf-api";
import { fetchOrganizationTurfs } from "@/lib/server-apis/single-turf/fetchOrganizationTurfs-api";
import TurfImageSlider from "@/components/single-turf/TurfImageSlider";
import TurfDetails from "@/components/single-turf/TurfDetails";
import OtherOrganizationTurfs from "@/components/single-turf/OtherOrganizationTurfs";
import ReviewSection from "@/components/single-turf/ReviewRating";
import BookingButton from "@/components/booking/BookingButton";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/authContext";
import { Card } from "@/components/ui/card";

export default function SingleTurfPage() {
  const params = useParams();
  const turfId = params.id as string;
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  
  const [turf, setTurf] = useState<ITurf | null>(null);
  const [otherTurfs, setOtherTurfs] = useState<ITurf[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch turf data
        const turfData = await fetchSingleTurf(turfId);
        if (!turfData) {
          router.push('/404');
          return;
        }
        
        setTurf(turfData);
        
        // Fetch other turfs if organization exists
        const organizationId = turfData.organization?._id;
        if (organizationId) {
          const otherTurfsData = await fetchOrganizationTurfs(organizationId, turfId);
          setOtherTurfs(otherTurfsData || []);
        }
      } catch (error) {
        console.error("Error loading turf data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [turfId, router]);

  // Show loading state
  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background pt-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="bg-white rounded-xl shadow-lg p-8 h-64"></div>
            <div className="bg-white rounded-xl shadow-lg p-8 h-96 mt-8"></div>
          </div>
        </div>
      </div>
    );
  }

  // Return null if no turf (redirect happens in useEffect)
  if (!turf) return null;

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Hero Section */}
      <section className="w-full bg-white border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto py-6">
            {turf.images && turf.images.length > 0 && (
              <TurfImageSlider images={turf.images} />
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-8 space-y-8">
            <TurfDetails turf={turf} />
            <ReviewSection turfId={turfId} currentUser={user} />
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-4">
            <div className="sticky top-24">
              {otherTurfs.length > 0 && (
                <Card className="p-4 bg-white">
                  <OtherOrganizationTurfs
                    turfs={otherTurfs}
                    currentTurfId={turfId}
                  />
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Floating Booking Button */}
      <BookingButton turfId={turfId} />
    </div>
  );
}
