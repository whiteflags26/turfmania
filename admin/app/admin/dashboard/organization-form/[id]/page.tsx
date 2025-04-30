// app/admin/dashboard/organization-form/[id]/page.tsx
'use client';

import OrganizationForm, {
  OrganizationFormData,
} from '@/component/admin/organization-requests/OrganizationRequestForm';
import {
  createOrganization,
  getSingleOrganizationRequest,
} from '@/services/organizationService';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface ClientPageProps {
  params: Promise<{ id: string }>;      // params must be a Promise :contentReference[oaicite:9]{index=9}
}

export default function Page({ params }: ClientPageProps) {
  // resolve the route param before using it :contentReference[oaicite:10]{index=10}
  const [organization, setOrganization] = useState<OrganizationFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchOrg = async () => {
      try {
        setLoading(true);
        const { id } = await params;     // await the Promise :contentReference[oaicite:11]{index=11}

        const resp = await getSingleOrganizationRequest(id);
        if (!resp.success || !resp.data) {
          setError('Failed to load organization request');
          toast.error('Failed to load organization request data');
          return;
        }

        const org = resp.data;
        setOrganization({
          _id: org._id,
          name: org.name,
          address: org.location?.address ?? '',
          placeId: org.location?.place_id ?? '',
          city: org.location?.city ?? '',
          area: org.location?.area ?? '',
          subArea: org.location?.sub_area ?? '',
          postCode: org.location?.post_code ?? '',
          longitude: org.location?.coordinates?.coordinates[0] ?? 0,
          latitude: org.location?.coordinates?.coordinates[1] ?? 0,
          facilities: org.facilities ?? [],
          images: org.images ?? [],
          orgContactPhone: org.orgContactPhone ?? '',
          orgContactEmail: org.orgContactEmail ?? '',
          adminNotes: org.adminNotes ?? '',
          contactPhone: org.contactPhone ?? '',
          ownerEmail: org.ownerEmail ?? '',
        });
      } catch (err: any) {
        console.error(err);
        setError(err.message ?? 'Failed to load organization request');
        toast.error('Failed to load organization request data');
      } finally {
        setLoading(false);
      }
    };

    fetchOrg();
  }, [params]);

  const handleSubmit = async (formData: FormData) => {
    const { id } = await params;
    try {
      const result = await createOrganization(id, formData);
      if (!result.success) throw new Error('Failed to create organization');
      toast.success('Organization created successfully!');
      router.push('/admin/dashboard/organizations');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message ?? 'Failed to create organization');
    }
  };

  if (loading) return <div className="p-6 text-center">Loading…</div>;
  if (error || !organization) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error ?? 'Unknown error'}</p>
          <button
            onClick={() => router.push('/admin/dashboard/organization-requests')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            Back to Requests
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold">Create Organization from Request</h1>
      </div>
      <OrganizationForm
        initialData={organization}
        isEditing={false}
        onSubmit={handleSubmit}
        submitButtonText="Create Organization"
      />
    </>
  );
}
