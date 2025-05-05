"use client";

import ErrorDisplay from "@/component/errors/ErrorDisplay";
import { getAllFacilities } from "@/services/organizationService";
import {
  prepareImagesForSubmission,
  handleImageUpload as processImageUpload,
} from "@/utils/image-upload";
import {
  Building,
  Check,
  MapPin,
  Package,
  Upload,
  X,
  Loader,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { autocomplete } from "barikoiapis";
import '@/lib/config/barikoiConfig';
import { IBarikoiSuggestion } from "@/types/barikoi";

export interface ImageFile extends File {
  preview?: string;
}

export interface OrganizationFormData {
  requestId?: string;
  organizationName: string;
  address: string;
  placeId: string;
  city: string;
  area: string;
  subArea: string;
  postCode: string;
  longitude: number;
  latitude: number;
  facilities: string[];
  images?: string[];
  orgContactPhone: string;
  orgContactEmail: string;
  adminNotes: string;
  contactPhone: string;
  ownerEmail: string;
}

interface OrganizationFormProps {
  readonly initialData?: Partial<OrganizationFormData>;
  readonly isEditing: boolean;
  readonly onSubmit: (formData: FormData) => Promise<void>;
  readonly submitButtonText?: string;
  readonly facilityOptionsOverride?: string[];
}

export default function OrganizationForm({
  initialData = {},
  isEditing,
  onSubmit,
  submitButtonText = "Submit",
  facilityOptionsOverride,
}: OrganizationFormProps) {
  // Form state with defaults or initial data
  const [name, setName] = useState(initialData.organizationName ?? "");
  const [address, setAddress] = useState(initialData.address ?? "");
  const [placeId, setPlaceId] = useState(initialData.placeId ?? "");
  const [city, setCity] = useState(initialData.city ?? "");
  const [area, setArea] = useState(initialData.area ?? "");
  const [subArea, setSubArea] = useState(initialData.subArea ?? "");
  const [postCode, setPostCode] = useState(initialData.postCode ?? "");
  const [longitude, setLongitude] = useState(initialData.longitude ?? 0);
  const [latitude, setLatitude] = useState(initialData.latitude ?? 0);
  const [facilities, setFacilities] = useState<string[]>(
    initialData.facilities || []
  );
  const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orgContactPhone, setOrgContactPhone] = useState(
    initialData.orgContactPhone ?? ""
  );
  const [orgContactEmail, setOrgContactEmail] = useState(
    initialData.orgContactEmail ?? ""
  );
  const [adminNotes, setAdminNotes] = useState(initialData.adminNotes ?? "");
  const [contactPhone, setContactPhone] = useState(
    initialData.contactPhone ?? ""
  );
  const [ownerEmail, setOwnerEmail] = useState(initialData.ownerEmail ?? "");
  const [facilityOptions, setFacilityOptions] = useState<string[]>(
    facilityOptionsOverride ?? []
  );

  // Track existing images separately for edit mode
  const [existingImages, setExistingImages] = useState<string[]>(
    initialData.images || []
  );

  const [addressQuery, setAddressQuery] = useState(initialData.address ?? "");
  const [locationSuggestions, setLocationSuggestions] = useState<
    IBarikoiSuggestion[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    // Cleanup function to revoke object URLs
    return () => {
      imageFiles.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [imageFiles]);

  useEffect(() => {
    // Only fetch facilities if they weren't provided externally
    if (!facilityOptionsOverride) {
      const fetchFacilities = async () => {
        try {
          const response = await getAllFacilities();
          if (response.success) {
            setFacilityOptions(
              response.data.map((facility: any) => facility.name)
            );
          }
        } catch (error) {
          console.error("Error fetching facilities:", error);
          setError("Failed to load facilities");
        }
      };

      fetchFacilities();
    }
  }, [facilityOptionsOverride]);

  useEffect(() => {
    const fetchLocationSuggestions = async () => {
      if (addressQuery.length < 3) {
        setLocationSuggestions([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await autocomplete({ q: addressQuery });
        console.log(response);
        if (response.places && Array.isArray(response.places)) {
          // Convert string values to numbers to match the IBarikoiSuggestion interface
          const transformedPlaces = response.places.map((place) => ({
            ...place,
            longitude:
              typeof place.longitude === "string"
                ? parseFloat(place.longitude)
                : place.longitude,
            latitude:
              typeof place.latitude === "string"
                ? parseFloat(place.latitude)
                : place.latitude,
            id:
              typeof place.id === "string" ? parseInt(place.id, 10) : place.id,
            postCode: place.postCode
              ? typeof place.postCode === "string"
                ? parseInt(place.postCode, 10)
                : place.postCode
              : undefined,
          }));
          setLocationSuggestions(transformedPlaces);
        }
      } catch (error) {
        console.error("Error fetching location suggestions:", error);
        toast.error("Failed to load location suggestions");
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(fetchLocationSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [addressQuery]);

  const handleFacilityToggle = (facility: string) => {
    setFacilities((prev) =>
      prev.includes(facility)
        ? prev.filter((f) => f !== facility)
        : [...prev, facility]
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const result = processImageUpload(
      Array.from(e.target.files),
      [], // We handle existing images separately
      {
        maxImages: 5 - (imageFiles.length + existingImages.length),
        allowedTypes: ["image/jpeg", "image/png", "image/webp"],
      }
    );

    if (!result.isValid) {
      toast.error(result.errorMessage ?? "Image upload failed");
      return;
    }

    // Create ImageFile objects with previews
    const newFiles: ImageFile[] = result.files.map((file) => {
      const imageFile = file as ImageFile;
      imageFile.preview = URL.createObjectURL(file);
      return imageFile;
    });

    setImageFiles((prev) => [...prev, ...newFiles]);
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLocationSelect = (place: IBarikoiSuggestion) => {
    // Fill in all the location fields from the selected suggestion
    setAddress(place.address);
    setPlaceId(place.id.toString());
    setCity(place.city || "");
    setArea(place.area || "");
    // Note: subArea is not directly available in the Barikoi response
    setPostCode(place.postCode ? place.postCode.toString() : "");
    setLongitude(place.longitude);
    setLatitude(place.latitude);

    // Clear suggestions after selection
    setLocationSuggestions([]);
    setAddressQuery(place.address);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();

      // Add basic form fields
      formData.set("name", name);
      formData.set("facilities", JSON.stringify(facilities));
      formData.set(
        "location",
        JSON.stringify({
          place_id: placeId,
          address,
          city,
          area,
          sub_area: subArea,
          post_code: postCode,
          coordinates: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
        })
      );
      formData.set("orgContactPhone", orgContactPhone);
      formData.set("orgContactEmail", orgContactEmail);
      formData.set("adminNotes", adminNotes);
      formData.set("contactPhone", contactPhone);
      formData.set("ownerEmail", ownerEmail);

      // Add ID if editing
      if (isEditing && initialData.requestId) {
        formData.set("_id", initialData.requestId);
      }

      // Handle images properly for both new and existing
      const preparedFormData = prepareImagesForSubmission(
        formData,
        imageFiles,
        existingImages
      );

      // Use the provided submit handler
      await onSubmit(preparedFormData);

      // Show success message
      toast.success(
        `Organization ${isEditing ? "updated" : "created"} successfully!`
      );
      setSuccess(true);

      // Reset form or redirect after success
      setTimeout(() => {
        setSuccess(false);
        // For create form, reset all fields
        if (!isEditing) {
          setName("");
          setAddress("");
          setPlaceId("");
          setCity("");
          setArea("");
          setSubArea("");
          setPostCode("");
          setLongitude(0);
          setLatitude(0);
          setFacilities([]);
          setImageFiles([]);
          setExistingImages([]);
          setOrgContactPhone("");
          setOrgContactEmail("");
          setAdminNotes("");
          setContactPhone("");
          setOwnerEmail("");
        }
      }, 3000);
    } catch (err: any) {
      const statusCode = err.response?.status;
      const errorMessage = err.response?.data?.message ?? err.message;

      if (statusCode === 403) {
        return <ErrorDisplay statusCode={403} />;
      }

      setError(errorMessage);
      toast.error(
        errorMessage ??
          `Failed to ${isEditing ? "update" : "create"} organization`
      );
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    name &&
    address &&
    placeId &&
    city &&
    facilities.length > 0 &&
    orgContactPhone &&
    orgContactEmail;

  // Add error check at the top of your render
  if (error === "Unauthorized" || error === "Forbidden") {
    return <ErrorDisplay statusCode={403} />;
  }

  const totalImagesCount = imageFiles.length + existingImages.length;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? "Edit" : "Create New"} Organization
        </h1>
      </div>

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
          <Check className="h-5 w-5 text-green-500 mr-2" />
          <p className="text-green-700">
            Organization {isEditing ? "updated" : "created"} successfully!
          </p>
        </div>
      )}

      {error && error !== "Unauthorized" && error !== "Forbidden" && (
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
                <h2 className="text-lg font-medium text-gray-800">
                  Basic Information
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {/* Organization Name field */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-900"
                  >
                    Organization Name*
                  </label>
                  <input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm sm:text-sm text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter organization name"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Owner Contact Information */}
                  <div>
                    <label
                      htmlFor="contactPhone"
                      className="block text-sm font-medium text-gray-900"
                    >
                      Owner Contact Phone*
                    </label>
                    <input
                      id="contactPhone"
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm sm:text-sm text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="01XXXXXXXXX"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="ownerEmail"
                      className="block text-sm font-medium text-gray-900"
                    >
                      Owner Email*
                    </label>
                    <input
                      id="ownerEmail"
                      type="email"
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm sm:text-sm text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="owner@example.com"
                      required
                    />
                  </div>

                  {/* Organization Contact Information */}
                  <div>
                    <label
                      htmlFor="orgContactPhone"
                      className="block text-sm font-medium text-gray-900"
                    >
                      Organization Contact Phone*
                    </label>
                    <input
                      id="orgContactPhone"
                      type="tel"
                      value={orgContactPhone}
                      onChange={(e) => setOrgContactPhone(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm sm:text-sm text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="+8801XXXXXXXXX"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="orgContactEmail"
                      className="block text-sm font-medium text-gray-900"
                    >
                      Organization Email*
                    </label>
                    <input
                      id="orgContactEmail"
                      type="email"
                      value={orgContactEmail}
                      onChange={(e) => setOrgContactEmail(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm sm:text-sm text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="contact@organization.com"
                      required
                    />
                  </div>
                </div>

                {/* Admin Notes */}
                <div>
                  <label
                    htmlFor="adminNotes"
                    className="block text-sm font-medium text-gray-900"
                  >
                    Admin Notes
                  </label>
                  <textarea
                    id="adminNotes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm sm:text-sm text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Add any administrative notes here..."
                  />
                </div>
              </div>
            </div>

            {/* Location Info */}
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-gray-700" />
                <h2 className="text-lg font-medium text-gray-800">
                  Location Details
                </h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Address field with autocomplete */}
                <div className="md:col-span-2 relative"> {/* Add 'relative' here */}
                  <label
                    htmlFor="address"
                    className="block text-sm font-medium text-gray-900"
                  >
                    Full Address*
                  </label>
                  <div className="relative">
                    <input
                      id="address"
                      value={addressQuery}
                      onChange={(e) => setAddressQuery(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm sm:text-sm text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Search for an address..."
                      required
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Loader className="animate-spin h-4 w-4 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Location suggestions dropdown - Fixed positioning */}
                  {locationSuggestions.length > 0 && (
                    <div className="absolute z-50 left-0 right-0 mt-1 bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto">
                      {locationSuggestions.map((place) => (
                        <button
                          key={place.id}
                          type="button"
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 border-b border-gray-100 last:border-0 text-gray-800"
                          onClick={() => handleLocationSelect(place)}
                        >
                          {place.address}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="placeId"
                    className="block text-sm font-medium text-gray-900"
                  >
                    Place ID*
                  </label>
                  <input
                    id="placeId"
                    value={placeId}
                    onChange={(e) => setPlaceId(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm sm:text-sm text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter place ID"
                    required
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
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm sm:text-sm text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter city"
                    required
                  />
                </div>

                {/* New Area and Sub Area fields */}
                <div>
                  <label
                    htmlFor="area"
                    className="block text-sm font-medium text-gray-900"
                  >
                    Area
                  </label>
                  <input
                    id="area"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm sm:text-sm text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter area (optional)"
                  />
                </div>

                <div>
                  <label
                    htmlFor="subArea"
                    className="block text-sm font-medium text-gray-900"
                  >
                    Sub Area
                  </label>
                  <input
                    id="subArea"
                    value={subArea}
                    onChange={(e) => setSubArea(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm sm:text-sm text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter sub area (optional)"
                  />
                </div>

                <div>
                  <label
                    htmlFor="postCode"
                    className="block text-sm font-medium text-gray-900"
                  >
                    Post Code
                  </label>
                  <input
                    id="postCode"
                    value={postCode}
                    onChange={(e) => setPostCode(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm sm:text-sm text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
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
                    id="longitude"
                    type="number"
                    value={longitude}
                    onChange={(e) =>
                      setLongitude(parseFloat(e.target.value) || 0)
                    }
                    step="0.000001"
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm sm:text-sm text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.000000"
                    required
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
                    id="latitude"
                    type="number"
                    value={latitude}
                    onChange={(e) =>
                      setLatitude(parseFloat(e.target.value) || 0)
                    }
                    step="0.000001"
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm sm:text-sm text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.000000"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Facilities */}
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50 flex items-center">
                <Package className="w-5 h-5 mr-2 text-gray-700" />
                <h2 className="text-lg font-medium text-gray-800">
                  Facilities
                </h2>
              </div>
              <div className="p-6 flex flex-wrap gap-2">
                {facilityOptions.length > 0 ? (
                  facilityOptions.map((facility) => (
                    <button
                      key={facility}
                      type="button"
                      onClick={() => handleFacilityToggle(facility)}
                      className={`px-4 py-2 rounded-full text-sm font-medium ${
                        facilities.includes(facility)
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {facility}
                    </button>
                  ))
                ) : (
                  <p className="text-gray-500">Loading facilities...</p>
                )}
              </div>
            </div>
          </div>

          {/* Right column - Images */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50">
                <h2 className="text-lg font-medium text-gray-800">
                  Organization Images
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <label
                  htmlFor="imageUpload"
                  className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 ${
                    totalImagesCount >= 5 ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <div className="flex flex-col items-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, or WEBP (Max: 5 images)
                    </p>
                  </div>
                  <input
                    id="imageUpload"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={totalImagesCount >= 5}
                  />
                </label>

                {/* Display existing images */}
                {existingImages.length > 0 && (
                  <>
                    <h3 className="text-sm font-medium text-gray-700">
                      Existing Images
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {existingImages.map((imgUrl, index) => (
                        <div key={imgUrl} className="relative group">
                          <img
                            src={imgUrl}
                            alt={`Existing ${index + 1}`}
                            className="object-cover w-full h-32 rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => removeExistingImage(index)}
                            className="absolute top-1 right-1 bg-white rounded-full p-1 shadow hover:bg-red-100"
                          >
                            <X className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Display new images */}
                {imageFiles.length > 0 && (
                  <>
                    <h3 className="text-sm font-medium text-gray-700">
                      {existingImages.length > 0 ? "New Images" : "Images"}
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {imageFiles.map((file, index) => (
                        <div key={file.name} className="relative group">
                          <img
                            src={file.preview ?? URL.createObjectURL(file)}
                            alt={`Preview ${index + 1}`}
                            className="object-cover w-full h-32 rounded-md"
                            onLoad={() => {
                              // If we created a new preview, revoke it after loading
                              if (!file.preview) {
                                URL.revokeObjectURL(URL.createObjectURL(file));
                              }
                            }}
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
                  </>
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
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            {loading ? "Submitting..." : submitButtonText}
          </button>
        </div>
      </form>
    </div>
  );
}
