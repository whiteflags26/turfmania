// app/organization/[id]/view-turfs/[turfId]/page.tsx
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
import { motion } from "framer-motion";

export default function ViewOrganizationPage() {
  const { id } = useParams();
  const [organization, setOrganization] = useState<IOrganization | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<IOrganization>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState<string[]>([]);
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
    setEditedData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFacilityToggle = (facilityName: string) => {
    const currentFacilities = [...(editedData.facilities || [])];
    if (currentFacilities.includes(facilityName)) {
      setEditedData((prev) => ({
        ...prev,
        facilities: (prev.facilities || []).filter((f) => f !== facilityName),
      }));
    } else {
      setEditedData((prev) => ({
        ...prev,
        facilities: [...(prev.facilities || []), facilityName],
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
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setNewImages(filesArray);

      // Generate previews for all selected files
      const previews: string[] = [];
      filesArray.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result) {
            previews.push(reader.result as string);
            setImagePreview([...previews]);
          }
        };
        reader.readAsDataURL(file);
      });
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

      // Append all images to formData
      if (newImages.length > 0) {
        newImages.forEach((image, index) => {
          formData.append("images", image);
        });
      }

      const updatedOrganization = await updateOrganization(
        id as string,
        formData
      );
      setOrganization(updatedOrganization);
      setIsEditing(false);
      // Clear the previews and new images after successful update
      setImagePreview([]);
      setNewImages([]);
      toast.success("Organization updated successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update organization");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !organization) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="animate-spin rounded-full h-14 w-14 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-gray-600">
        <p className="text-lg">Organization Not Found</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-6 py-10"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 space-y-4 md:space-y-0">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          {isEditing ? (
            <input
              type="text"
              name="name"
              value={editedData.name || ""}
              onChange={handleInputChange}
              className="text-3xl font-bold tracking-tight border-b-2 border-blue-400 bg-transparent focus:outline-none w-full"
            />
          ) : (
            organization.name
          )}
        </h1>
        <div className="flex gap-3">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-2 px-5 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-800 transition disabled:opacity-50"
              >
                <FiX /> Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex items-center gap-2 px-5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50"
              >
                <FiSave /> {isLoading ? "Saving..." : "Save"}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition"
            >
              <FiEdit2 /> Edit
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Images Section */}
          <SectionCard title="Organization Images">
            {isEditing ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Show image previews for newly selected files */}
                  {imagePreview.length > 0 &&
                    imagePreview.map((preview, idx) => (
                      <ImageContainer
                        key={`preview-${idx}`}
                        src={preview}
                        alt={`New Preview ${idx + 1}`}
                      />
                    ))}

                  {/* Show existing images if no new previews available */}
                  {imagePreview.length === 0 &&
                    organization.images.map((img, idx) => (
                      <ImageContainer
                        key={`existing-${idx}`}
                        src={img}
                        alt={`Existing Image ${idx + 1}`}
                      />
                    ))}
                </div>
                <UploadInput onChange={handleImageUpload} multiple={true} />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {organization.images.map((img, idx) => (
                  <ImageContainer
                    key={idx}
                    src={img}
                    alt={`Image ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </SectionCard>

          {/* Facilities Section */}
          <SectionCard title="Facilities">
            <div className="flex flex-wrap gap-3">
              {isEditing
                ? availableFacilities.map((facility) => (
                    <FacilityButton
                      key={facility._id}
                      name={facility.name}
                      selected={(editedData.facilities || []).includes(
                        facility.name
                      )}
                      onClick={() => handleFacilityToggle(facility.name)}
                    />
                  ))
                : organization.facilities.map((facility, idx) => (
                    <div
                      key={idx}
                      className="px-4 py-2 rounded-full bg-gray-100 text-gray-800 text-sm"
                    >
                      {facility}
                    </div>
                  ))}
            </div>
          </SectionCard>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-8">
          {/* Contact Info */}
          <SectionCard title="Contact Info">
            <ContactInfo
              isEditing={isEditing}
              editedData={editedData}
              organization={organization}
              handleInputChange={handleInputChange}
            />
          </SectionCard>

          {/* Location Info */}
          <SectionCard title="Location">
            <LocationInfo
              isEditing={isEditing}
              editedData={editedData}
              organization={organization}
              handleLocationChange={handleLocationChange}
            />
          </SectionCard>

          {/* Metadata */}
          <SectionCard title="Metadata">
            <div className="text-sm text-gray-700 space-y-2">
              <p>
                <strong>Created:</strong>{" "}
                {new Date(organization.createdAt).toLocaleDateString()}
              </p>
              <p>
                <strong>Last Updated:</strong>{" "}
                {new Date(organization.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </SectionCard>
        </div>
      </div>
    </motion.div>
  );
}

// Components

const SectionCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="bg-white rounded-xl shadow hover:shadow-lg transition p-6 space-y-4"
  >
    <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
    {children}
  </motion.div>
);

const ImageContainer = ({ src, alt }: { src: string; alt: string }) => (
  <div className="relative w-full h-64 rounded-md overflow-hidden">
    <Image src={src} alt={alt} fill className="object-cover" />
  </div>
);

const UploadInput = ({
  onChange,
  multiple = false,
}: {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  multiple?: boolean;
}) => (
  <input
    type="file"
    accept="image/*"
    onChange={onChange}
    multiple={multiple}
    className="w-full block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
  />
);

const FacilityButton = ({
  name,
  selected,
  onClick,
}: {
  name: string;
  selected: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-4 py-2 rounded-full text-sm font-medium transition ${
      selected
        ? "bg-blue-500 text-white"
        : "bg-gray-200 hover:bg-gray-300 text-gray-800"
    }`}
  >
    {name}
  </button>
);

const ContactInfo = ({
  isEditing,
  editedData,
  organization,
  handleInputChange,
}: any) => (
  <>
    {["orgContactEmail", "orgContactPhone"].map((field) => (
      <div key={field} className="space-y-1">
        <label className="text-sm text-gray-500">
          {field.includes("Email") ? "Email" : "Phone"}
        </label>
        {isEditing ? (
          <input
            type={field.includes("Email") ? "email" : "tel"}
            name={field}
            value={editedData[field] || ""}
            onChange={handleInputChange}
            className="w-full px-3 py-2 rounded-md border focus:ring-2 focus:ring-blue-400 focus:outline-none"
          />
        ) : (
          <div className="flex items-center gap-2 text-gray-800">
            {field.includes("Email") ? <FiMail /> : <FiPhone />}
            <span>{organization[field]}</span>
          </div>
        )}
      </div>
    ))}
  </>
);

const LocationInfo = ({
  isEditing,
  editedData,
  organization,
  handleLocationChange,
}: any) => (
  <>
    {["address", "area", "sub_area", "city"].map((field) => (
      <div key={field} className="space-y-1">
        <label className="text-sm text-gray-500 capitalize">
          {field.replace("_", " ")}
        </label>
        {isEditing ? (
          <input
            type="text"
            value={editedData.location?.[field] || ""}
            onChange={(e) => handleLocationChange(field, e.target.value)}
            className="w-full px-3 py-2 rounded-md border focus:ring-2 focus:ring-blue-400 focus:outline-none"
          />
        ) : (
          <p className="text-gray-800">
            {organization.location?.[field] || "Not specified"}
          </p>
        )}
      </div>
    ))}
    {organization.location.coordinates?.coordinates && (
      <a
        href={generateBariKoiMapLink(
          organization.location.coordinates.coordinates[1],
          organization.location.coordinates.coordinates[0]
        )}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1 text-blue-600 hover:underline text-sm"
      >
        <FiMapPin /> View on Barikoi Maps
      </a>
    )}
  </>
);
