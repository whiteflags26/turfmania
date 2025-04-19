import { ITurf } from "@/types/turf";
import { fetchSingleTurf } from "@/lib/server-apis/single-turf/single-turf-api";
import { fetchOrganizationTurfs } from "@/lib/server-apis/single-turf/fetchOrganizationTurfs-api";
import TurfImageSlider from "@/components/single-turf/TurfImageSlider";
import TurfDetails from "@/components/single-turf/TurfDetails";
import OtherOrganizationTurfs from "@/components/single-turf/OtherOrganizationTurfs";
import { notFound } from "next/navigation";


interface SingleTurfPageProps {
  params: {
    id: string; 
  };
}

export default async function SingleTurfPage({ params }: SingleTurfPageProps) {
  const turfId = params.id;

  // 1. Fetch the main turf details
  const turf: ITurf | null = await fetchSingleTurf(turfId);

  // Handle case where turf is not found
  if (!turf) {
    notFound(); // Renders the nearest not-found.tsx or the default 404 page
  }

  // 2. Fetch other turfs from the same organization
  // Check if organization data is available and has an _id
  const organizationId = turf.organization?._id; // Use optional chaining in case organization is not populated or missing _id

  // Fetch other turfs only if organizationId is available
  const otherTurfs: ITurf[] = organizationId
    ? (await fetchOrganizationTurfs(organizationId,turfId)) || [] // Fetch and default to empty array on error/null
    : []; // If no organizationId, there are no other turfs from this org

  return (
    // Use a main container for padding and responsiveness
    <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
      {/* Turf Image Slider Section */}
      {turf.images && turf.images.length > 0 && (
        <section className="mb-8">
          <TurfImageSlider images={turf.images} />
        </section>
      )}

      {/* Turf Details Section */}
      <section className="mb-12">
        <TurfDetails turf={turf} />
      </section>

      {/* Other Turfs by Organization Section */}
      {/* Only render this section if there are other turfs to show */}
      {otherTurfs.length > 0 && (
        <section>
          {/* Pass the full list and the current turf ID for filtering within the component */}
          <OtherOrganizationTurfs turfs={otherTurfs} currentTurfId={turfId} />
        </section>
      )}
    </div>
  );
}


//Modify the contents 
