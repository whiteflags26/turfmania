'use client';

import {
  createOrganization,
  getSingleOrganizationRequest,
} from '@/services/organizationService';
import {
  ArrowLeft,
  Building,
  Check,
  MapPin,
  Package,
  Upload,
  X,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

// Mock facility options
const FACILITY_OPTIONS = [
  'football',
  'cricket',
  'basketball',
  'tennis',
  'badminton',
  'volleyball',
  'swimming_pool',
  'gym',
  'table_tennis',
  'indoor_sports',
];

export default function EditOrganizationForm() {
  const router = useRouter();
  const params = useParams();
  const organizationId = params.id as string;

  // State declarations
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [placeId, setPlaceId] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [subArea, setSubArea] = useState('');
  const [postCode, setPostCode] = useState('');
  const [longitude, setLongitude] = useState(0);
  const [latitude, setLatitude] = useState(0);
  const [facilities, setFacilities] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch organization data
  useEffect(() => {
    async function fetchOrganizationData() {
      try {
        setFetchLoading(true);
        const response = await getSingleOrganizationRequest(organizationId);

        if (response.success && response.data) {
          const orgData = response.data;

          // Populate form fields
          setName(orgData.organizationName);
          setAddress(orgData.location.address);
          setPlaceId(orgData.location.place_id);
          setCity(orgData.location.city);
          setArea(orgData.location.area || '');
          setSubArea(orgData.location.sub_area || '');
          setPostCode(orgData.location.post_code || '');
          setLongitude(orgData.location.coordinates.coordinates[0]);
          setLatitude(orgData.location.coordinates.coordinates[1]);

          setFacilities(orgData.facilities);
          setImages(orgData.images);
          setNewImages(orgData.images);
        }
      } catch (err: any) {
        console.error('Error fetching organization data:', err);
        setError(err.message || 'Failed to load organization data');
      } finally {
        setFetchLoading(false);
      }
    }

    if (organizationId) {
      fetchOrganizationData();
    }
  }, [organizationId]);

  // Handler functions
  const handleFacilityToggle = (facility: string) => {
    setFacilities(prev =>
      prev.includes(facility)
        ? prev.filter(f => f !== facility)
        : [...prev, facility],
    );
  };

  const formatFacilityName = (facility: string) => {
    return facility
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const remainingSlots = 5 - (images.length + newImages.length);
      if (remainingSlots <= 0) return;

      const files = Array.from(e.target.files).slice(0, remainingSlots);

      // Validate each file
      const validFiles = files.filter(file => {
        const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(
          file.type,
        );
        const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
        return isValidType && isValidSize;
      });

      if (validFiles.length !== files.length) {
        toast.error(
          'Some files were skipped. Please ensure all files are images under 5MB.',
        );
      }

      setNewImages(prev => [...prev, ...validFiles]);
    }
  };

  const removeImage = (index: number) => {
    // Remove existing image
    if (index < images.length) {
      const updatedImages = [...images];
      updatedImages.splice(index, 1);
      setImages(updatedImages);
    } else {
      // Remove newly added image (not in the original images array)
      setNewImages(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();

      // Add organization name
      formData.append('organizationName', name);

      // Add facilities
      facilities.forEach((facility, index) => {
        formData.append(`facilities[]`, facility);
      });

      // Add location details
      const locationData = {
        place_id: placeId,
        address: address,
        coordinates: {
          type: 'Point',
          coordinates: [longitude, latitude], // [longitude, latitude]
        },
        area: area || undefined,
        sub_area: subArea || undefined,
        city: city,
        post_code: postCode || undefined,
      };

      formData.append('location', JSON.stringify(locationData));

      // Add request ID and wasEdited flag
      if (params.id) {
        formData.append('requestId', params.id);
      }
      formData.append('wasEdited', 'False');

      const response = await createOrganization(formData);

      if (response.success) {
        setSuccess(true);
        toast.success('Organization created successfully!');
        router.push('/admin/dashboard/organization-requests');
      }
    } catch (err: any) {
      console.error('Error creating organization:', err);
      setError(err.message || 'Failed to create organization');
      toast.error(err.message || 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    name && address && placeId && city && facilities.length > 0;

  const goBack = () => {
    router.back();
  };

  if (fetchLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6 flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
          <svg
            className="animate-spin h-10 w-10 text-blue-500 mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="text-gray-600">Loading organization data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex flex-col items-center">
          <X className="h-10 w-10 text-red-500 mb-4" />
          <h2 className="text-lg font-medium text-red-800 mb-2">
            Error Loading Organization
          </h2>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={goBack}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // create input field classes
  const inputClasses =
    'mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-900';

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={goBack}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          Create Organization
        </h1>
      </div>

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
          <Check className="h-5 w-5 text-green-500 mr-2" />
          <p className="text-green-700">Organization created successfully!</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Basic Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                  <Building className="w-5 h-5 mr-2" />
                  Basic Information
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-900"
                    >
                      Organization Name*
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className={`${inputClasses} placeholder-gray-500`}
                      placeholder="Enter organization name"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Location Details */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Location Details
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label
                      htmlFor="address"
                      className="block text-sm font-medium text-gray-900"
                    >
                      Full Address*
                    </label>
                    <input
                      type="text"
                      id="address"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      className={`${inputClasses} placeholder-gray-500`}
                      placeholder="Enter full address"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="place_id"
                      className="block text-sm font-medium text-gray-900"
                    >
                      Place ID*
                    </label>
                    <input
                      type="text"
                      id="place_id"
                      value={placeId}
                      onChange={e => setPlaceId(e.target.value)}
                      className={`${inputClasses} placeholder-gray-500`}
                      placeholder="Enter place ID"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="city"
                      className="block text-sm font-medium text-gray-900"
                    >
                      City*
                    </label>
                    <input
                      type="text"
                      id="city"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      className={`${inputClasses} placeholder-gray-500`}
                      placeholder="Enter city"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="area"
                      className="block text-sm font-medium text-gray-900"
                    >
                      Area
                    </label>
                    <input
                      type="text"
                      id="area"
                      value={area}
                      onChange={e => setArea(e.target.value)}
                      className={`${inputClasses} placeholder-gray-500`}
                      placeholder="Enter area (optional)"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="sub_area"
                      className="block text-sm font-medium text-gray-900"
                    >
                      Sub Area
                    </label>
                    <input
                      type="text"
                      id="sub_area"
                      value={subArea}
                      onChange={e => setSubArea(e.target.value)}
                      className={`${inputClasses} placeholder-gray-500`}
                      placeholder="Enter sub area (optional)"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="post_code"
                      className="block text-sm font-medium text-gray-900"
                    >
                      Post Code
                    </label>
                    <input
                      type="text"
                      id="post_code"
                      value={postCode}
                      onChange={e => setPostCode(e.target.value)}
                      className={`${inputClasses} placeholder-gray-500`}
                      placeholder="Enter post code (optional)"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="longitude"
                      className="block text-sm font-medium text-gray-900"
                    >
                      Longitude*
                    </label>
                    <input
                      type="number"
                      id="longitude"
                      value={longitude}
                      onChange={e =>
                        setLongitude(parseFloat(e.target.value) || 0)
                      }
                      step="0.000001"
                      className={`${inputClasses} placeholder-gray-500`}
                      placeholder="0.000000"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="latitude"
                      className="block text-sm font-medium text-gray-900"
                    >
                      Latitude*
                    </label>
                    <input
                      type="number"
                      id="latitude"
                      value={latitude}
                      onChange={e =>
                        setLatitude(parseFloat(e.target.value) || 0)
                      }
                      step="0.000001"
                      className={`${inputClasses} placeholder-gray-500`}
                      placeholder="0.000000"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Facilities */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Facilities
                </h2>
              </div>
              <div className="p-6">
                <div className="flex flex-wrap gap-2">
                  {FACILITY_OPTIONS.map(facility => (
                    <button
                      key={facility}
                      type="button"
                      onClick={() => handleFacilityToggle(facility)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        facilities.includes(facility)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      }`}
                    >
                      {formatFacilityName(facility)}
                    </button>
                  ))}
                </div>
                {facilities.length === 0 && (
                  <p className="mt-2 text-sm text-gray-500">
                    Please select at least one facility
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right column - Images */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                  <Upload className="w-5 h-5 mr-2" />
                  Organization Images
                  <span className="ml-2 text-sm text-gray-500">
                    ({newImages.length}/5 images)
                  </span>
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {/* New Image Upload */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">
                      Add Images
                    </h3>
                    <label
                      htmlFor="imageUpload"
                      className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 ${
                        newImages.length >= 5
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-gray-500" />
                        <p className="mb-2 text-sm text-gray-900">
                          <span className="font-semibold">Click to upload</span>{' '}
                          or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG or WEBP (Max size: 5MB)
                        </p>
                      </div>
                      <input
                        id="imageUpload"
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={newImages.length >= 5}
                      />
                    </label>
                  </div>

                  {/* New Images Preview */}
                  {newImages.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">
                        Images to Upload
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {newImages.map((file, idx) => (
                          <div key={`new-${idx}`} className="relative group">
                            <div className="aspect-square w-full overflow-hidden rounded-md">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`New image ${idx + 1}`}
                                className="object-cover w-full h-full"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNewImages(prev =>
                                      prev.filter((_, i) => i !== idx),
                                    );
                                  }}
                                  className="bg-red-500 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-red-600"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={goBack}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !isFormValid}
            className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              loading || !isFormValid
                ? 'bg-blue-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? (
              <div className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Creating...
              </div>
            ) : (
              'Create Organization'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
