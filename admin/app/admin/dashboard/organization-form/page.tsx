'use client';

import {
  Building,
  Check,
  MapPin,
  Package,
  Plus,
  Upload,
  X,
} from 'lucide-react';
import { useState } from 'react';

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

export default function OrganizationForm() {
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
  const [imageCount, setImageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
    const newCount = Math.min(imageCount + 1, 5);
    setImageCount(newCount);
  };

  const removeImage = (index: number) => {
    setImageCount(prev => Math.max(0, prev - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Add your API call here
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error creating organization:', error);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    name && address && placeId && city && facilities.length > 0;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <button className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          Create New Organization
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
                      className="block text-sm font-medium text-gray-700"
                    >
                      Organization Name*
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
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
                      className="block text-sm font-medium text-gray-700"
                    >
                      Full Address*
                    </label>
                    <input
                      type="text"
                      id="address"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                      placeholder="Enter full address"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="place_id"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Place ID*
                    </label>
                    <input
                      type="text"
                      id="place_id"
                      value={placeId}
                      onChange={e => setPlaceId(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                      placeholder="Enter place ID"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="city"
                      className="block text-sm font-medium text-gray-700"
                    >
                      City*
                    </label>
                    <input
                      type="text"
                      id="city"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                      placeholder="Enter city"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="area"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Area
                    </label>
                    <input
                      type="text"
                      id="area"
                      value={area}
                      onChange={e => setArea(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                      placeholder="Enter area (optional)"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="sub_area"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Sub Area
                    </label>
                    <input
                      type="text"
                      id="sub_area"
                      value={subArea}
                      onChange={e => setSubArea(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                      placeholder="Enter sub area (optional)"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="post_code"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Post Code
                    </label>
                    <input
                      type="text"
                      id="post_code"
                      value={postCode}
                      onChange={e => setPostCode(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                      placeholder="Enter post code (optional)"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="longitude"
                      className="block text-sm font-medium text-gray-700"
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
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                      placeholder="0.000000"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="latitude"
                      className="block text-sm font-medium text-gray-700"
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
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
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
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                <h2 className="text-lg font-medium text-gray-900">
                  Organization Images
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {/* Image upload */}
                  <div className="flex items-center justify-center w-full">
                    <label
                      htmlFor="imageUpload"
                      className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 ${
                        imageCount >= 5 ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-gray-500" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span>{' '}
                          or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG or WEBP (Max: 5 images)
                        </p>
                      </div>
                      <input
                        id="imageUpload"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        disabled={imageCount >= 5}
                      />
                    </label>
                  </div>

                  {/* Image previews */}
                  {imageCount > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {/* Show uploaded image placeholders */}
                      {Array.from({ length: imageCount }).map((_, idx) => (
                        <div key={idx} className="relative group">
                          <div className="aspect-square w-full overflow-hidden rounded-md bg-gray-200 flex items-center justify-center">
                            <img
                              src="/api/placeholder/400/400"
                              alt={`Preview ${idx + 1}`}
                              className="object-cover w-full h-full"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-90 hover:opacity-100"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}

                      {/* Empty placeholders */}
                      {Array.from({ length: Math.max(0, 5 - imageCount) }).map(
                        (_, i) => (
                          <div
                            key={`placeholder-${i}`}
                            className="aspect-square w-full overflow-hidden rounded-md bg-gray-100 flex items-center justify-center"
                          >
                            <Plus className="h-6 w-6 text-gray-400" />
                          </div>
                        ),
                      )}
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
