"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  FiEdit2,
  FiSave,
  FiX,
  FiMapPin,
  FiPhone,
  FiMail,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import Image from "next/image";
import { IOrganization, ILocation } from "@/types/organization";
import { IFacility } from "@/types/facility";
import {
  fetchOrganization,
  fetchFacilities,
  updateOrganization,
} from "@/lib/server-apis/organization-details";
import { generateBariKoiMapLink } from "@/lib/server-apis/BariKoi/generateBariKoiMapLink-api";
import { useAuth } from "@/lib/contexts/authContext";


export default function ViewOrganizationPage() {
  const { id } = useParams();
  const [organization, setOrganization] = useState<IOrganization | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<IOrganization>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [availableFacilities, setAvailableFacilities] = useState<IFacility[]>(
    []
  );

  useEffect(() => {
    const loadOrganization = async () => {
      try {
        setIsLoading(true);
        const organizationData = await fetchOrganization(id as string);
        setOrganization(organizationData);
        setEditedData({
          name: organizationData.name,
          facilities: organizationData.facilities,
          location: organizationData.location,
          orgContactPhone: organizationData.orgContactPhone,
          orgContactEmail: organizationData.orgContactEmail,
        });
      } catch (error) {
        console.error(error);
        toast.error("Failed to load organization data");
      } finally {
        setIsLoading(false);
      }
    };

    loadOrganization();
  }, [id]);

  // Load facilities when entering edit mode
  useEffect(() => {
    if (isEditing) {
      const loadFacilities = async () => {
        try {
          const facilitiesData = await fetchFacilities();
          setAvailableFacilities(facilitiesData);
        } catch (error) {
          console.error(error);
          toast.error("Failed to load facilities");
        }
      };

      loadFacilities();
    }
  }, [isEditing]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditedData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFacilityChange = (facilityName: string, isChecked: boolean) => {
    const currentFacilities = [...(editedData.facilities || [])];

    if (isChecked && !currentFacilities.includes(facilityName)) {
      // Add the facility
      setEditedData((prev) => ({
        ...prev,
        facilities: [...(prev.facilities || []), facilityName],
      }));
    } else if (!isChecked && currentFacilities.includes(facilityName)) {
      // Remove the facility
      setEditedData((prev) => ({
        ...prev,
        facilities: (prev.facilities || []).filter((f) => f !== facilityName),
      }));
    }
  };

  const handleLocationChange = (field: keyof ILocation, value: string) => {
    setEditedData((prev) => ({
      ...prev,
      location: {
        ...prev.location!,
        [field]: value,
      },
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewImages([file]);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);

      const formData = new FormData();
      formData.append("name", editedData.name || "");
      formData.append("orgContactPhone", editedData.orgContactPhone || "");
      formData.append("orgContactEmail", editedData.orgContactEmail || "");
      formData.append(
        "facilities",
        JSON.stringify(editedData.facilities || [])
      );
      formData.append("location", JSON.stringify(editedData.location || {}));

      if (newImages.length > 0) {
        formData.append("images", newImages[0]);
      }

      const updatedOrganization = await updateOrganization(
        id as string,
        formData
      );
      setOrganization(updatedOrganization);
      setIsEditing(false);
      toast.success("Organization updated successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update organization");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !organization) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-600">Organization not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditing ? (
            <input
              type="text"
              name="name"
              value={editedData.name || ""}
              onChange={handleInputChange}
              className="border-b-2 border-blue-500 focus:outline-none bg-transparent"
            />
          ) : (
            organization.name
          )}
        </h1>
        {isEditing ? (
          <div className="flex space-x-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors flex items-center"
            >
              <FiX className="mr-2" /> Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
            >
              <FiSave className="mr-2" />{" "}
              {isLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
          >
            <FiEdit2 className="mr-2" /> Edit Organization
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Images and Basic Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Images */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Images</h2>
            </div>
            <div className="p-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(imagePreview || organization.images[0]) && (
                      <div className="relative h-64 rounded-lg overflow-hidden">
                        <Image
                          src={imagePreview || organization.images[0]}
                          alt={organization.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          priority
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload New Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {organization.images.map((image, index) => (
                    <div
                      key={index}
                      className="relative h-64 rounded-lg overflow-hidden"
                    >
                      <Image
                        src={image}
                        alt={`${organization.name} ${index + 1}`}
                        fill
                        priority
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Facilities */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">
                Facilities
              </h2>
            </div>
            <div className="p-4">
              {isEditing ? (
                <div className="space-y-3">
                  {availableFacilities.map((facility) => (
                    <div
                      key={facility._id}
                      className="flex items-center space-x-2"
                    >
                      <input
                        type="checkbox"
                        checked={(editedData.facilities || []).includes(
                          facility.name
                        )}
                        onChange={(e) =>
                          handleFacilityChange(facility.name, e.target.checked)
                        }
                        className="form-checkbox h-5 w-5 text-blue-600"
                      />
                      <label className="text-gray-800">{facility.name}</label>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {organization.facilities.map((facility) => (
                    <div
                      key={facility}
                      className="px-4 py-2 bg-gray-50 text-gray-700 rounded-full text-sm font-medium border border-gray-200"
                    >
                      {facility}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Contact and Location */}
        <div className="space-y-6">
          {/* Contact Information */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">
                Contact Information
              </h2>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    name="orgContactEmail"
                    value={editedData.orgContactEmail || ""}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="flex items-center space-x-2">
                    <FiMail className="text-gray-400" />
                    <span className="text-gray-800">
                      {organization.orgContactEmail}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Phone
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="orgContactPhone"
                    value={editedData.orgContactPhone || ""}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="flex items-center space-x-2">
                    <FiPhone className="text-gray-400" />
                    <span className="text-gray-800">
                      {organization.orgContactPhone}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Location</h2>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Address
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedData.location?.address || ""}
                    onChange={(e) =>
                      handleLocationChange("address", e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="flex items-start space-x-2">
                    <FiMapPin className="text-gray-400 mt-0.5" />
                    <span className="text-gray-800">
                      {organization.location.address}
                    </span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Area
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedData.location?.area || ""}
                      onChange={(e) =>
                        handleLocationChange("area", e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <span className="text-gray-800">
                      {organization.location.area || "Not specified"}
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Sub Area
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedData.location?.sub_area || ""}
                      onChange={(e) =>
                        handleLocationChange("sub_area", e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <span className="text-gray-800">
                      {organization.location.sub_area || "Not specified"}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  City
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedData.location?.city || ""}
                    onChange={(e) =>
                      handleLocationChange("city", e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <span className="text-gray-800">
                    {organization.location.city}
                  </span>
                )}
              </div>
              <div className="h-64 bg-gray-100 rounded-lg overflow-hidden">
                {organization.location.coordinates?.coordinates ? (
                  <a
                    href={generateBariKoiMapLink(
                      organization.location.coordinates.coordinates[1],
                      organization.location.coordinates.coordinates[0]
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center h-full text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    <FiMapPin className="text-3xl mr-2" />
                    <span>View on Barikoi Maps</span>
                  </a>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <FiMapPin className="text-4xl" />
                    <span className="ml-2">
                      No location coordinates available
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">
                Organization Details
              </h2>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Created At</span>
                <span className="text-sm text-gray-800">
                  {new Date(organization.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Last Updated</span>
                <span className="text-sm text-gray-800">
                  {new Date(organization.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Organization ID</span>
                <span className="text-sm text-gray-800 font-mono">
                  {organization._id}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
