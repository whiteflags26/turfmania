'use client';

import OrganizationForm from '@/component/admin/organization-requests/OrganizationRequestForm';
import { createOrganization } from '@/services/organizationService';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function CreateOrganizationPage() {
  const router = useRouter();
  
  const handleSubmit = async (formData: FormData) => {
    try {
      await createOrganization(formData);
      toast.success('Organization created successfully!');
      // Optional: redirect after successful creation
      // router.push('/admin/dashboard/organizations');
    } catch (error) {
      console.error('Error creating organization:', error);
      throw error; // Re-throw to let the form component handle the error display
    }
  };

  return (
    <>
      <div className="mb-6">
        <button 
          onClick={() => router.back()} 
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          ← Back
        </button>
      </div>
      <OrganizationForm
        isEditing={false}
        onSubmit={handleSubmit}
        submitButtonText="Create Organization"
      />
    </>
  );
}
