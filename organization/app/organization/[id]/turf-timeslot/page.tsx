import { Suspense } from "react";
import TurfSelection from "@/components/timeslot/TurfSelection";

interface PageProps {
  params: Promise<{id: string}>;
}

export default async function OrganizationTurfTimeslotPage({
  params,
}: PageProps) {
  const organizationId = (await params).id;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Turf Timeslot Management</h1>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Select Turf</h2>

        <Suspense fallback={<TurfSelectionSkeleton />}>
          <TurfSelection organizationId={organizationId} />
        </Suspense>
      </div>
    </div>
  );
}

function TurfSelectionSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-12 bg-gray-200 rounded-md animate-pulse"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 bg-gray-100 rounded-lg animate-pulse"
          ></div>
        ))}
      </div>
    </div>
  );
}