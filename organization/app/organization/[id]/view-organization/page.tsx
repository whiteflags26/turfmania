'use client';

import { generateBariKoiMapLink } from '@/lib/server-apis/BariKoi/generateBariKoiMapLink-api';
import {
  fetchFacilities,
  fetchOrganization,
  updateOrganization,
} from '@/lib/server-apis/organization-details';
import { IFacility } from '@/types/facility';
import { ILocation, IOrganization } from '@/types/organization';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  FiCalendar,
  FiClock,
  FiEdit2,
  FiImage,
  FiMail,
  FiMapPin,
  FiPhone,
  FiSave,
  FiX,
} from 'react-icons/fi';

export default function ViewOrganizationPage() {
  const { id } = useParams();
  const [organization, setOrganization] = useState<IOrganization | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<IOrganization>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [availableFacilities, setAvailableFacilities] = useState<IFacility[]>(
    [],
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
        toast.error('Failed to load organization data');
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
          toast.error('Failed to load facilities');
        }
      };
      loadFacilities();
    }
  }, [isEditing]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setEditedData(prev => ({ ...prev, [name]: value }));
  };

  const handleFacilityToggle = (facilityName: string) => {
    const currentFacilities = [...(editedData.facilities || [])];
    if (currentFacilities.includes(facilityName)) {
      setEditedData(prev => ({
        ...prev,
        facilities: (prev.facilities || []).filter(f => f !== facilityName),
      }));
    } else {
      setEditedData(prev => ({
        ...prev,
        facilities: [...(prev.facilities || []), facilityName],
      }));
    }
  };

  const handleLocationChange = (field: keyof ILocation, value: string) => {
    setEditedData(prev => ({
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

      const previews: string[] = [];
      filesArray.forEach(file => {
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
      formData.append('name', editedData.name ?? '');
      formData.append('orgContactPhone', editedData.orgContactPhone ?? '');
      formData.append('orgContactEmail', editedData.orgContactEmail ?? '');
      formData.append(
        'facilities',
        JSON.stringify(editedData.facilities || []),
      );
      formData.append('location', JSON.stringify(editedData.location || {}));

      if (newImages.length > 0) {
        newImages.forEach(image => {
          formData.append('images', image);
        });
      }

      const updatedOrganization = await updateOrganization(
        id as string,
        formData,
      );
      setOrganization(updatedOrganization);
      setIsEditing(false);
      setImagePreview([]);
      setNewImages([]);
      toast.success('Organization updated successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update organization');
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

  let facilitiesContent: React.ReactNode;
  if (organization.facilities.length > 0) {
    facilitiesContent = (
      <div className="flex flex-wrap gap-2">
        {organization.facilities.map(facility => (
          <span
            key={facility}
            className="px-3 py-1.5 bg-blue-50 text-blue-800 rounded-lg text-sm font-medium"
          >
            {facility}
          </span>
        ))}
      </div>
    );
  } else {
    facilitiesContent = (
      <p className="text-gray-500">No facilities added yet</p>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 py-8"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              name="name"
              value={editedData.name ?? ''}
              onChange={handleInputChange}
              className="text-3xl font-bold text-gray-900 border-b-2 border-blue-500 bg-transparent focus:outline-none w-full py-1"
              placeholder="Organization Name"
            />
          ) : (
            <h1 className="text-3xl font-bold text-gray-900 truncate">
              {organization.name}
            </h1>
          )}
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 transition disabled:opacity-50"
              >
                <FiX />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50 shadow-md hover:shadow-lg"
              >
                <FiSave />
                <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition shadow-md hover:shadow-lg"
            >
              <FiEdit2 />
              <span>Edit Organization</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Images Section */}
          <SectionCard title="Organization Images">
            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {imagePreview.length > 0
                    ? imagePreview.map(preview => (
                        <ImageContainer
                          key={preview}
                          src={preview}
                          alt={`New Preview`}
                        />
                      ))
                    : organization.images.map(img => (
                        <ImageContainer
                          key={img}
                          src={img}
                          alt={`Existing Image`}
                        />
                      ))}
                </div>
                <label className="block w-full">
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 transition-colors cursor-pointer">
                    <FiImage className="text-gray-400 text-2xl mb-2" />
                    <span className="text-sm text-gray-500">
                      Click to upload images
                    </span>
                    <span className="text-xs text-gray-400 mt-1">
                      PNG, JPG, JPEG (max. 5MB each)
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    multiple
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {organization.images.map(img => (
                  <motion.div
                    key={img}
                    whileHover={{ scale: 1.03 }}
                    className="rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <ImageContainer src={img} alt={`Image`} />
                  </motion.div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Facilities Section */}
          <SectionCard title="Facilities">
            {isEditing ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  Select available facilities:
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableFacilities.map(facility => (
                    <FacilityButton
                      key={facility._id}
                      name={facility.name}
                      selected={(editedData.facilities || []).includes(
                        facility.name,
                      )}
                      onClick={() => handleFacilityToggle(facility.name)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              facilitiesContent
            )}
          </SectionCard>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <SectionCard title="Contact Information">
            <div className="space-y-4">
              <ContactInfoItem
                icon={<FiPhone className="text-blue-600" />}
                label="Phone"
                isEditing={isEditing}
                value={
                  editedData.orgContactPhone ?? organization.orgContactPhone
                }
                name="orgContactPhone"
                onChange={handleInputChange}
                type="tel"
              />
              <ContactInfoItem
                icon={<FiMail className="text-blue-600" />}
                label="Email"
                isEditing={isEditing}
                value={
                  editedData.orgContactEmail ?? organization.orgContactEmail
                }
                name="orgContactEmail"
                onChange={handleInputChange}
                type="email"
              />
            </div>
          </SectionCard>

          {/* Location Info */}
          <SectionCard title="Location Details">
            <div className="space-y-4">
              {/* Only include string fields in the map operation */}
              {['address', 'area', 'sub_area', 'city', 'post_code'].map(
                field => (
                  <LocationInfoItem
                    key={field}
                    field={field}
                    isEditing={isEditing}
                    value={
                      // Add a type assertion to ensure we're only passing string values
                      (editedData.location?.[
                        field as keyof ILocation
                      ] as string) ||
                      (organization.location?.[
                        field as keyof ILocation
                      ] as string) ||
                      ''
                    }
                    onChange={(value: string) =>
                      handleLocationChange(field as keyof ILocation, value)
                    }
                  />
                ),
              )}
              {organization.location?.coordinates?.coordinates && (
                <a
                  href={generateBariKoiMapLink(
                    organization.location.coordinates.coordinates[1],
                    organization.location.coordinates.coordinates[0],
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors text-sm"
                >
                  <FiMapPin />
                  View on Barikoi Maps
                </a>
              )}
            </div>
          </SectionCard>

          {/* Metadata */}
          <SectionCard title="Organization Metadata">
            <div className="space-y-3">
              <MetadataItem
                icon={<FiCalendar />}
                label="Created"
                value={new Date(organization.createdAt).toLocaleDateString()}
              />
              <MetadataItem
                icon={<FiClock />}
                label="Last Updated"
                value={new Date(organization.updatedAt).toLocaleDateString()}
              />
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
    initial={{ y: 10, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 space-y-4 border border-gray-100"
  >
    <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">
      {title}
    </h2>
    {children}
  </motion.div>
);

const ImageContainer = ({ src, alt }: { src: string; alt: string }) => (
  <div className="relative w-full aspect-square rounded-lg overflow-hidden">
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover"
      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
    />
  </div>
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
    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
      selected
        ? 'bg-blue-600 text-white shadow-md'
        : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
    }`}
  >
    {name}
  </button>
);

const ContactInfoItem = ({
  icon,
  label,
  value,
  name,
  isEditing,
  onChange,
  type = 'text',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  name: string;
  isEditing: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
}) => (
  <div>
    <label className="text-sm text-gray-500 font-medium">{label}</label>
    {isEditing ? (
      <div className="relative mt-1">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          {icon}
        </div>
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
        />
      </div>
    ) : (
      <div className="flex items-center gap-2 mt-1 text-gray-800">
        <span className="text-blue-600">{icon}</span>
        <span>{value || 'Not specified'}</span>
      </div>
    )}
  </div>
);

const LocationInfoItem = ({
  field,
  value,
  isEditing,
  onChange,
}: {
  field: string;
  value: string;
  isEditing: boolean;
  onChange: (value: string) => void;
}) => (
  <div>
    <label className="text-sm text-gray-500 font-medium capitalize">
      {field.replace('_', ' ')}
    </label>
    {isEditing ? (
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
      />
    ) : (
      <p className="mt-1 text-gray-800">{value || 'Not specified'}</p>
    )}
  </div>
);

const MetadataItem = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="flex items-center gap-3">
    <div className="p-2 bg-gray-100 rounded-full text-gray-600">{icon}</div>
    <div>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <p className="text-gray-800">{value}</p>
    </div>
  </div>
);
