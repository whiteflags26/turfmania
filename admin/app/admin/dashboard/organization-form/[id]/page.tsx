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

export default function CreateOrganizationFromRequestPage({
  params,
}: {
 readonly params: { readonly id: string };
}) {
  const [organization, setOrganization] = useState<OrganizationFormData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchOrganizationRequest = async () => {
      try {
        setLoading(true);

        // Make sure we have an ID
        if (!params.id) {
          setError('Missing organization request ID');
          setLoading(false);
          return;
        }

        const response = await getSingleOrganizationRequest(params.id);

        if (!response.success || !response.data) {
          setError('Failed to load organization request data');
          return;
        }

        // Map API data to form data structure
        const org = response.data;
        const formData: OrganizationFormData = {
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
        };

        setOrganization(formData);
      } catch (err: any) {
        console.error('Error fetching organization request:', err);
        setError(err.message ?? 'Failed to load organization request');
        toast.error('Failed to load organization request data');
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizationRequest();
  }, [params.id]);

  const handleSubmit = async (formData: FormData) => {
    try {
      // Create organization from the request
      const result = await createOrganization(params.id, formData);

      if (!result.success) {
        throw new Error('Failed to create organization');
      }

      toast.success('Organization created successfully!');

      // Redirect to organizations list after success
      router.push('/admin/dashboard/organizations');
    } catch (error: any) {
      console.error('Error creating organization:', error);
      throw error; // Re-throw to let the form component handle the error display
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        Loading organization request data...
      </div>
    );
  }

  // For the error message display, ensure we're safely rendering text:
  if (error || !organization) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          {/* Use proper text escaping for error messages */}
          <p className="text-red-700">
            {error ?? 'Failed to load organization request'}
          </p>
          <button
            onClick={() =>
              router.push('/admin/dashboard/organization-requests')
            }
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
