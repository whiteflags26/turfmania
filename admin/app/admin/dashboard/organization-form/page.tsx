'use client';

import {
  Building,
  Check,
  MapPin,
  Package,
  Upload,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { createOrganization } from '@/services/organizationService'; // Import the backend service

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
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);
    const total = imageFiles.length + filesArray.length;
    const allowedFiles = total > 5
      ? filesArray.slice(0, 5 - imageFiles.length)
      : filesArray;
    setImageFiles(prev => [...prev, ...allowedFiles]);
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Prepare form data
      const formData = new FormData();
      formData.set('organizationName', name);
      formData.set('facilities[]', JSON.stringify(facilities));
      formData.set(
        'location',
        JSON.stringify({
          place_id: placeId,
          address,
          city,
          area,
          sub_area: subArea,
          post_code: postCode,
          coordinates: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
        }),
      );
      formData.set('wasEdited', 'False');

      // Call the backend service
      const response = await createOrganization(formData);
      console.log('Organization created:', response);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      console.error('Error creating organization:', error);
      setError(error.message);
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

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <X className="h-5 w-5 text-red-500 mr-2" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50 flex items-center">
                <Building className="w-5 h-5 mr-2 text-gray-700" />
                <h2 className="text-lg font-medium text-gray-800">Basic Information</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-900">
                    Organization Name*
                  </label>
                  <input
                    id="name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm sm:text-sm text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter organization name"
                  />
                </div>
              </div>
            </div>

            {/* Location Info */}
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-gray-700" />
                <h2 className="text-lg font-medium text-gray-800">Location Details</h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-900">
                    Full Address*
                  </label>
                  <input
                    id="address"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm sm:text-sm text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter full address"
                  />
                </div>

                <div>
                  <label htmlFor="placeId" className="block text-sm font-medium text-gray-900">
                    Place ID*
                  </label>
                  <input
                    id="placeId"
                    value={placeId}
                    onChange={e => setPlaceId(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm sm:text-sm text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter place ID"
                  />
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-900">
                    City*
                  </label>
                  <input
                    id="city"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm sm:text-sm text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter city"
                  />
                </div>

                <div>
                  <label htmlFor="longitude" className="block text-sm font-medium text-gray-900">
                    Longitude*
                  </label>
                  <input
                    id="longitude"
                    type="number"
                    value={longitude}
                    onChange={e => setLongitude(parseFloat(e.target.value))}
                    step="0.000001"
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm sm:text-sm text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.000000"
                  />
                </div>

                <div>
                  <label htmlFor="latitude" className="block text-sm font-medium text-gray-900">
                    Latitude*
                  </label>
                  <input
                    id="latitude"
                    type="number"
                    value={latitude}
                    onChange={e => setLatitude(parseFloat(e.target.value))}
                    step="0.000001"
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm sm:text-sm text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.000000"
                  />
                </div>
              </div>
            </div>

            {/* Facilities */}
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50 flex items-center">
                <Package className="w-5 h-5 mr-2 text-gray-700" />
                <h2 className="text-lg font-medium text-gray-800">Facilities</h2>
              </div>
              <div className="p-6 flex flex-wrap gap-2">
                {FACILITY_OPTIONS.map(facility => (
                  <button
                    key={facility}
                    type="button"
                    onClick={() => handleFacilityToggle(facility)}
                    className={`px-4 py-2 rounded-full text-sm font-medium ${
                      facilities.includes(facility)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {formatFacilityName(facility)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right column - Images */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50">
                <h2 className="text-lg font-medium text-gray-800">Organization Images</h2>
              </div>
              <div className="p-6 space-y-4">
                <label
                  htmlFor="imageUpload"
                  className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 ${
                    imageFiles.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <div className="flex flex-col items-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, or WEBP (Max: 5 images)</p>
                  </div>
                  <input
                    id="imageUpload"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={imageFiles.length >= 5}
                  />
                </label>

                {imageFiles.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {imageFiles.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          className="object-cover w-full h-32 rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-white rounded-full p-1 shadow hover:bg-red-100"
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!isFormValid || loading}
            className={`px-6 py-2 rounded-md text-white font-semibold ${
              isFormValid
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  );
}