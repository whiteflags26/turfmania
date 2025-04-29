
// "use client";
// import { useState, useEffect } from "react";
// import { useParams, useRouter } from "next/navigation";
// import Image from "next/image";
// import Link from "next/link";
// import { motion } from "framer-motion";
// import { toast } from "react-hot-toast";
// import {
//   FiMapPin,
//   FiClock,
//   FiUsers,
//   FiArrowLeft,
//   FiDollarSign,
//   FiPhone,
//   FiMail,
//   FiStar,
//   FiHome,
//   FiEdit2,
//   FiSave,
//   FiX,
// } from "react-icons/fi";
// import { fetchTurfById } from "@/lib/server-apis/view-turfs/fetchTurfbyId-api";
// import { updateTurf } from "@/lib/server-apis/view-turfs/updateTurfbyId-api";
// import { ITurf } from "@/types/turf";
// import { generateBariKoiMapLink } from "@/lib/server-apis/BariKoi/generateBariKoiMapLink-api";
// import { fetchSports } from "@/lib/server-apis/view-turfs/fetchSports-api";
// import { fetchTeamSizes } from "@/lib/server-apis/view-turfs/fetchTeamSizes-api";

// // Days of the week for operating hours
// const DAYS = [
//   "Sunday",
//   "Monday",
//   "Tuesday",
//   "Wednesday",
//   "Thursday",
//   "Friday",
//   "Saturday",
// ];

// export default function TurfDetailPage() {
//   const params = useParams();
//   const router = useRouter();
//   const { id: organizationId, turfId } = params;

//   const [turf, setTurf] = useState<ITurf | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [activeImage, setActiveImage] = useState(0);
//   const [today] = useState(new Date().getDay());
//   const [isEditing, setIsEditing] = useState(false);
//   const [editedData, setEditedData] = useState<Partial<ITurf>>({});
//   const [availableSports, setAvailableSports] = useState<
//     { _id: string; name: string }[]
//   >([]);
//   const [availableTeamSizes, setAvailableTeamSizes] = useState<
//     { _id: string; name: number }[]
//   >([]);
//   const [newImages, setNewImages] = useState<File[]>([]);
//   const [imagePreview, setImagePreview] = useState<string[]>([]);

//   useEffect(() => {
//     const loadTurf = async () => {
//       try {
//         setLoading(true);
//         if (turfId) {
//           const turfData = await fetchTurfById(turfId as string);
//           // Validate data before setting state
//           if (!turfData || !turfData.organization) {
//             throw new Error("Invalid turf data received");
//           }
//           setTurf(turfData);
//           setEditedData({
//             basePrice: turfData.basePrice,
//             sports: turfData.sports,
//             team_size: turfData.team_size,
//             operatingHours: turfData.operatingHours || [],
//           });
//         }
//       } catch (error) {
//         console.error("Error loading turf:", error);
//         toast.error("Failed to load turf details");
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadTurf();
//   }, [turfId]);

//   // Reset activeImage when adding new images or when turf changes
//   useEffect(() => {
//     if (imagePreview.length > 0) {
//       setActiveImage(0);
//     } else if (turf && turf.images && turf.images.length > 0) {
//       setActiveImage(0);
//     }
//   }, [imagePreview, turf]);

//   useEffect(() => {
//     if (isEditing) {
//       const loadSportsAndTeamSizes = async () => {
//         try {
//           const [sportsData, teamSizesData] = await Promise.all([
//             fetchSports(),
//             fetchTeamSizes(),
//           ]);
//           setAvailableSports(sportsData);
//           setAvailableTeamSizes(teamSizesData);
//         } catch (error) {
//           console.error("Error loading sports or team sizes:", error);
//           toast.error("Failed to load sports or team sizes");
//         }
//       };
//       loadSportsAndTeamSizes();
//     }
//   }, [isEditing]);

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target;
//     setEditedData((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleSportToggle = (sportName: string) => {
//     const currentSports = [...(editedData.sports || [])];
//     if (currentSports.includes(sportName)) {
//       setEditedData((prev) => ({
//         ...prev,
//         sports: (prev.sports || []).filter((s) => s !== sportName),
//       }));
//     } else {
//       setEditedData((prev) => ({
//         ...prev,
//         sports: [...(prev.sports || []), sportName],
//       }));
//     }
//   };

//   const handleTeamSizeChange = (size: number) => {
//     setEditedData((prev) => ({ ...prev, team_size: size }));
//   };

//   const handleOperatingHourChange = (
//     day: number,
//     field: "open" | "close",
//     value: string
//   ) => {
//     setEditedData((prev) => {
//       const updatedHours = [...(prev.operatingHours || [])];
//       const dayIndex = updatedHours.findIndex((h) => h.day === day);

//       if (dayIndex >= 0) {
//         updatedHours[dayIndex] = { ...updatedHours[dayIndex], [field]: value };
//       } else {
//         updatedHours.push({ day, open: "", close: "", [field]: value });
//       }

//       return { ...prev, operatingHours: updatedHours };
//     });
//   };

//   const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files.length > 0) {
//       const filesArray = Array.from(e.target.files);
//       setNewImages(filesArray);

//       // Generate previews for all selected files
//       const previews: string[] = [];
//       filesArray.forEach((file) => {
//         const reader = new FileReader();
//         reader.onload = () => {
//           if (reader.result) {
//             previews.push(reader.result as string);
//             setImagePreview([...previews]);
//           }
//         };
//         reader.readAsDataURL(file);
//       });
//     }
//   };

//   const handleSubmit = async () => {
//     try {
//       setLoading(true);
//       const formData = new FormData();

//       // Append editable fields
//       if (editedData.basePrice !== undefined)
//         formData.append("basePrice", editedData.basePrice.toString());
//       if (editedData.sports)
//         formData.append("sports", JSON.stringify(editedData.sports));
//       if (editedData.team_size !== undefined)
//         formData.append("team_size", editedData.team_size.toString());
//       if (editedData.operatingHours)
//         formData.append(
//           "operatingHours",
//           JSON.stringify(editedData.operatingHours)
//         );

//       // Append images if there are new ones
//       if (newImages.length > 0) {
//         newImages.forEach((image) => {
//           formData.append("images", image);
//         });
//       }

//       const updatedTurf = await updateTurf(turfId as string, formData);
      
//       // Validate updated data
//       if (!updatedTurf || !updatedTurf.organization) {
//         throw new Error("Invalid data received after update");
//       }
      
//       setTurf(updatedTurf);
//       setIsEditing(false);
//       setImagePreview([]);
//       setNewImages([]);
//       toast.success("Turf updated successfully!");
//     } catch (error) {
//       console.error("Error updating turf:", error);
//       toast.error("Failed to update turf");
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-[70vh]">
//         <div className="animate-spin rounded-full h-14 w-14 border-4 border-blue-500 border-t-transparent"></div>
//       </div>
//     );
//   }

//   if (!turf) {
//     return (
//       <div className="flex flex-col items-center justify-center h-[70vh] text-gray-600">
//         <p className="text-lg">Turf Not Found</p>
//         <button
//           onClick={() => router.back()}
//           className="mt-4 flex items-center gap-2 text-blue-600 hover:underline"
//         >
//           <FiArrowLeft /> Go Back
//         </button>
//       </div>
//     );
//   }

//   // Make sure we have a valid image source
//   const getImageSrc = () => {
//     if (imagePreview.length > 0 && activeImage < imagePreview.length) {
//       return imagePreview[activeImage];
//     } else if (turf.images && turf.images.length > 0) {
//       // Ensure activeImage is within bounds of turf.images
//       const validIndex = Math.min(activeImage, turf.images.length - 1);
//       return turf.images[validIndex];
//     }
//     return "/placeholder-turf.jpg";
//   };

//   // Check if organization data exists
//   const hasOrgData = turf.organization && turf.organization.location;

//   return (
//     <motion.div
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       className="max-w-7xl mx-auto px-4 sm:px-6 py-10"
//     >
//       {/* Breadcrumb navigation */}
//       <nav className="flex items-center text-sm text-gray-500 mb-6">
//         <Link
//           href={`/organization/${organizationId}`}
//           className="hover:text-blue-600 transition-colors"
//         >
//           <FiHome className="inline mr-1" /> Dashboard
//         </Link>
//         <span className="mx-2">/</span>
//         <Link
//           href={`/organization/${organizationId}/view-turf`}
//           className="hover:text-blue-600 transition-colors"
//         >
//           Turfs
//         </Link>
//         <span className="mx-2">/</span>
//         <span className="text-gray-900 font-medium">{turf.name}</span>
//       </nav>

//       {/* Header with edit buttons */}
//       <div className="flex justify-between items-center mb-6">
//         <button
//           onClick={() => router.back()}
//           className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
//         >
//           <FiArrowLeft /> Back to Turfs
//         </button>

//         {isEditing ? (
//           <div className="flex gap-3">
//             <button
//               onClick={() => setIsEditing(false)}
//               className="flex items-center gap-2 px-5 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-800 transition disabled:opacity-50"
//             >
//               <FiX /> Cancel
//             </button>
//             <button
//               onClick={handleSubmit}
//               disabled={loading}
//               className="flex items-center gap-2 px-5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50"
//             >
//               <FiSave /> {loading ? "Saving..." : "Save"}
//             </button>
//           </div>
//         ) : (
//           <button
//             onClick={() => setIsEditing(true)}
//             className="flex items-center gap-2 px-5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition"
//           >
//             <FiEdit2 /> Edit
//           </button>
//         )}
//       </div>

//       {/* Main content container */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//         {/* Left column - Images and key info */}
//         <div className="lg:col-span-2 space-y-8">
//           {/* Image gallery */}
//           <div className="bg-white rounded-xl shadow overflow-hidden">
//             {/* Main image */}
//             <div className="relative h-96 w-full">
//               <Image
//                 src={getImageSrc()}
//                 alt={turf.name}
//                 fill
//                 className="object-cover"
//                 sizes="(max-width: 1024px) 100vw, 66vw"
//               />
//             </div>

//             {/* Thumbnails */}
//             {(imagePreview.length > 0 || (turf.images && turf.images.length > 1)) && (
//               <div className="flex p-4 gap-2 overflow-x-auto">
//                 {imagePreview.length > 0
//                   ? imagePreview.map((img, idx) => (
//                       <button
//                         key={`preview-${idx}`}
//                         onClick={() => setActiveImage(idx)}
//                         className={`relative h-16 w-16 flex-shrink-0 rounded-md overflow-hidden border-2 transition-all ${
//                           activeImage === idx
//                             ? "border-blue-500 scale-105"
//                             : "border-transparent"
//                         }`}
//                       >
//                         <Image
//                           src={img}
//                           alt={`${turf.name} thumbnail ${idx + 1}`}
//                           fill
//                           className="object-cover"
//                           sizes="64px"
//                         />
//                       </button>
//                     ))
//                   : turf.images && turf.images.map((img, idx) => (
//                       <button
//                         key={idx}
//                         onClick={() => setActiveImage(idx)}
//                         className={`relative h-16 w-16 flex-shrink-0 rounded-md overflow-hidden border-2 transition-all ${
//                           activeImage === idx
//                             ? "border-blue-500 scale-105"
//                             : "border-transparent"
//                         }`}
//                       >
//                         <Image
//                           src={img}
//                           alt={`${turf.name} thumbnail ${idx + 1}`}
//                           fill
//                           className="object-cover"
//                           sizes="64px"
//                         />
//                       </button>
//                     ))}
//               </div>
//             )}

//             {isEditing && (
//               <div className="p-4 border-t">
//                 <input
//                   type="file"
//                   accept="image/*"
//                   onChange={handleImageUpload}
//                   multiple
//                   className="w-full block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
//                 />
//                 <p className="text-xs text-gray-500 mt-2">
//                   Upload new images to replace existing ones
//                 </p>
//               </div>
//             )}
//           </div>

//           {/* Turf details */}
//           <div className="bg-white rounded-xl shadow p-6 space-y-6">
//             <h1 className="text-3xl font-bold text-gray-900">{turf.name}</h1>

//             {hasOrgData && (
//               <div className="flex items-center text-gray-700">
//                 <FiMapPin className="mr-2 text-blue-600" />
//                 <p>
//                   {turf.organization.location.address}
//                   {turf.organization.location.area && `, ${turf.organization.location.area}`}
//                   {turf.organization.location.city && `, ${turf.organization.location.city}`}
//                 </p>
//               </div>
//             )}

//             <div className="flex items-start gap-2">
//               <FiClock className="mt-1 text-blue-600" />
//               <div>
//                 <p className="font-medium text-gray-900">Operating Hours</p>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
//                   {isEditing
//                     ? DAYS.map((dayName, dayIndex) => {
//                         const hours = editedData.operatingHours?.find(
//                           (h) => h.day === dayIndex
//                         ) ||
//                           (turf.operatingHours || []).find(
//                             (h) => h.day === dayIndex
//                           ) || { day: dayIndex, open: "", close: "" };
//                         return (
//                           <div
//                             key={dayIndex}
//                             className={`p-2 rounded ${
//                               dayIndex === today
//                                 ? "bg-blue-50 border-l-4 border-blue-500"
//                                 : ""
//                             }`}
//                           >
//                             <div className="flex justify-between items-center mb-1">
//                               <span
//                                 className={
//                                   dayIndex === today ? "font-medium" : ""
//                                 }
//                               >
//                                 {dayName}
//                               </span>
//                             </div>
//                             <div className="flex gap-2">
//                               <input
//                                 type="time"
//                                 value={hours.open || ""}
//                                 onChange={(e) =>
//                                   handleOperatingHourChange(
//                                     dayIndex,
//                                     "open",
//                                     e.target.value
//                                   )
//                                 }
//                                 className="w-full px-2 py-1 text-sm border rounded"
//                               />
//                               <span>to</span>
//                               <input
//                                 type="time"
//                                 value={hours.close || ""}
//                                 onChange={(e) =>
//                                   handleOperatingHourChange(
//                                     dayIndex,
//                                     "close",
//                                     e.target.value
//                                   )
//                                 }
//                                 className="w-full px-2 py-1 text-sm border rounded"
//                               />
//                             </div>
//                           </div>
//                         );
//                       })
//                     : (turf.operatingHours || []).map((hours) => (
//                         <div
//                           key={hours.day}
//                           className={`flex justify-between p-2 rounded ${
//                             hours.day === today
//                               ? "bg-blue-50 border-l-4 border-blue-500"
//                               : ""
//                           }`}
//                         >
//                           <span
//                             className={hours.day === today ? "font-medium" : ""}
//                           >
//                             {DAYS[hours.day]}
//                           </span>
//                           <span>
//                             {hours.open} - {hours.close}
//                           </span>
//                         </div>
//                       ))}
//                 </div>
//               </div>
//             </div>

//             <div className="flex flex-wrap gap-3 pt-2">
//               {isEditing ? (
//                 <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
//                   <div className="text-blue-600">
//                     <FiUsers />
//                   </div>
//                   <div>
//                     <p className="text-xs text-gray-500">Team Size</p>
//                     <div className="flex flex-wrap gap-2 mt-1">
//                       {availableTeamSizes.map((size) => (
//                         <button
//                           key={size._id}
//                           type="button"
//                           onClick={() => handleTeamSizeChange(size.name)}
//                           className={`px-3 py-1 rounded-full text-sm font-medium transition ${
//                             editedData.team_size === size.name
//                               ? "bg-blue-500 text-white"
//                               : "bg-gray-200 hover:bg-gray-300 text-gray-800"
//                           }`}
//                         >
//                           {size.name} players
//                         </button>
//                       ))}
//                     </div>
//                   </div>
//                 </div>
//               ) : (
//                 <DetailItem
//                   icon={<FiUsers />}
//                   label="Team Size"
//                   value={`${turf.team_size} players per team`}
//                 />
//               )}

//               {isEditing ? (
//                 <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
//                   <div className="text-blue-600">
//                     <FiDollarSign />
//                   </div>
//                   <div>
//                     <p className="text-xs text-gray-500">Base Price</p>
//                     <input
//                       type="number"
//                       name="basePrice"
//                       value={editedData.basePrice || turf.basePrice}
//                       onChange={handleInputChange}
//                       className="w-full px-2 py-1 border rounded"
//                     />
//                   </div>
//                 </div>
//               ) : (
//                 <DetailItem
//                   icon={<FiDollarSign />}
//                   label="Base Price"
//                   value={`৳${turf.basePrice}/hour`}
//                 />
//               )}
//             </div>

//             <div>
//               <h3 className="text-sm font-medium text-gray-900 mb-3">
//                 Sports Available
//               </h3>
//               {isEditing ? (
//                 <div className="flex flex-wrap gap-2">
//                   {availableSports.map((sport) => (
//                     <button
//                       key={sport._id}
//                       type="button"
//                       onClick={() => handleSportToggle(sport.name)}
//                       className={`px-4 py-2 rounded-full text-sm font-medium transition ${
//                         editedData.sports?.includes(sport.name)
//                           ? "bg-blue-500 text-white"
//                           : "bg-gray-200 hover:bg-gray-300 text-gray-800"
//                       }`}
//                     >
//                       {sport.name}
//                     </button>
//                   ))}
//                 </div>
//               ) : (
//                 <div className="flex flex-wrap gap-2">
//                   {(turf.sports || []).map((sport, idx) => (
//                     <span
//                       key={idx}
//                       className="px-4 py-2 bg-blue-100 text-gray-800 font-medium rounded-full"
//                     >
//                       {sport}
//                     </span>
//                   ))}
//                 </div>
//               )}
//             </div>

//             {hasOrgData && turf.organization.facilities && (
//               <div className="pt-4">
//                 {turf.organization.facilities.length > 0 && (
//                   <div className="mt-3">
//                     <p className="text-gray-700 mb-2">Available Facilities:</p>
//                     <div className="flex flex-wrap gap-2">
//                       {turf.organization.facilities.map((facility, idx) => (
//                         <span
//                           key={idx}
//                           className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-gray-800 text-sm rounded-full"
//                         >
//                           {facility}
//                         </span>
//                       ))}
//                     </div>
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Right column - Contact and booking info */}
//         <div className="space-y-6">
//           {/* Contact info */}
//           {hasOrgData && (
//             <div className="bg-white rounded-xl shadow p-6">
//               <h3 className="text-xl font-bold text-gray-900 mb-4">
//                 Contact Information
//               </h3>
//               <div className="space-y-4">
//                 {turf.organization.orgContactPhone && (
//                   <div className="flex items-start">
//                     <FiPhone className="mt-1 mr-3 text-blue-600" />
//                     <div>
//                       <p className="text-sm text-gray-500">Phone</p>
//                       <p className="text-gray-900">
//                         {turf.organization.orgContactPhone}
//                       </p>
//                     </div>
//                   </div>
//                 )}

//                 {turf.organization.orgContactEmail && (
//                   <div className="flex items-start">
//                     <FiMail className="mt-1 mr-3 text-blue-600" />
//                     <div>
//                       <p className="text-sm text-gray-500">Email</p>
//                       <p className="text-gray-900">
//                         {turf.organization.orgContactEmail}
//                       </p>
//                     </div>
//                   </div>
//                 )}

//                 <div className="flex items-start">
//                   <FiMapPin className="mt-1 mr-3 text-blue-600" />
//                   <div>
//                     <p className="text-sm text-gray-500">Location</p>
//                     <p className="text-gray-900">
//                       {turf.organization.location.address}
//                     </p>
//                     {(turf.organization.location.city || turf.organization.location.post_code) && (
//                       <p className="text-gray-900">
//                         {turf.organization.location.city}
//                         {turf.organization.location.post_code && `, ${turf.organization.location.post_code}`}
//                       </p>
//                     )}

//                     {turf.organization.location.coordinates && (
//                       <a
//                         href={generateBariKoiMapLink(
//                           turf.organization.location.coordinates.coordinates[1],
//                           turf.organization.location.coordinates.coordinates[0]
//                         )}
//                         target="_blank"
//                         rel="noopener noreferrer"
//                         className="mt-2 inline-flex items-center gap-1 text-blue-600 hover:underline text-sm"
//                       >
//                         <FiMapPin /> View on Barikoi Maps
//                       </a>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Reviews summary */}
//           <div className="bg-white rounded-xl shadow p-6">
//             <div className="flex items-center justify-between mb-4">
//               <h3 className="text-xl font-bold text-gray-900">Reviews</h3>
//               <span className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
//                 <FiStar className="mr-1 text-yellow-500" />
//                 {(turf.reviews && turf.reviews.length) || 0} reviews
//               </span>
//             </div>
//             {turf.reviews && turf.reviews.length > 0 ? (
//               <p className="text-gray-600">
//                 This turf has received {turf.reviews.length} reviews from users.
//               </p>
//             ) : (
//               <p className="text-gray-600">No reviews yet for this turf.</p>
//             )}
//           </div>
//         </div>
//       </div>
//     </motion.div>
//   );
// }

// // Utility component for detail items
// const DetailItem = ({
//   icon,
//   label,
//   value,
// }: {
//   icon: React.ReactNode;
//   label: string;
//   value: string;
// }) => (
//   <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
//     <div className="text-blue-600">{icon}</div>
//     <div>
//       <p className="text-xs text-gray-500">{label}</p>
//       <p className="font-medium">{value}</p>
//     </div>
//   </div>
// );


"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  FiMapPin,
  FiClock,
  FiUsers,
  FiArrowLeft,
  FiDollarSign,
  FiPhone,
  FiMail,
  FiStar,
  FiHome,
  FiEdit2,
  FiSave,
  FiX,
  FiPlus,
  FiImage,
} from "react-icons/fi";
import { fetchTurfById } from "@/lib/server-apis/view-turfs/fetchTurfbyId-api";
import { updateTurf } from "@/lib/server-apis/view-turfs/updateTurfbyId-api";
import { ITurf } from "@/types/turf";
import { generateBariKoiMapLink } from "@/lib/server-apis/BariKoi/generateBariKoiMapLink-api";
import { fetchSports } from "@/lib/server-apis/view-turfs/fetchSports-api";
import { fetchTeamSizes } from "@/lib/server-apis/view-turfs/fetchTeamSizes-api";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const DetailItem = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="flex items-center gap-3 bg-gray-50/50 hover:bg-gray-50 transition-colors px-4 py-3 rounded-lg border border-gray-100">
    <div className="text-blue-600 p-2 bg-blue-50 rounded-full">{icon}</div>
    <div>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="font-medium text-gray-800">{value}</p>
    </div>
  </div>
);

const OperatingHourItem = ({
  day,
  hours,
  today,
  isEditing,
  onChange,
}: {
  day: string;
  hours: { open: string; close: string };
  today: boolean;
  isEditing: boolean;
  onChange?: (field: "open" | "close", value: string) => void;
}) => {
  return (
    <div
      className={`p-3 rounded-lg transition-all ${
        today
          ? "bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500"
          : "bg-white hover:bg-gray-50 border border-gray-100"
      }`}
    >
      <div className="flex justify-between items-center mb-2">
        <span className={today ? "font-semibold text-blue-700" : "font-medium"}>
          {day}
        </span>
      </div>
      {isEditing ? (
        <div className="flex items-center gap-2">
          <input
            type="time"
            value={hours.open || ""}
            onChange={(e) => onChange?.("open", e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          />
          <span className="text-gray-400">to</span>
          <input
            type="time"
            value={hours.close || ""}
            onChange={(e) => onChange?.("close", e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          />
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm">
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
            {hours.open || "Closed"}
          </span>
          <span className="text-gray-400">to</span>
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
            {hours.close || "Closed"}
          </span>
        </div>
      )}
    </div>
  );
};

export default function TurfDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id: organizationId, turfId } = params;

  const [turf, setTurf] = useState<ITurf | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [today] = useState(new Date().getDay());
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<ITurf>>({});
  const [availableSports, setAvailableSports] = useState<
    { _id: string; name: string }[]
  >([]);
  const [availableTeamSizes, setAvailableTeamSizes] = useState<
    { _id: string; name: number }[]
  >([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [imagePreview, setImagePreview] = useState<string[]>([]);

  useEffect(() => {
    const loadTurf = async () => {
      try {
        setLoading(true);
        if (turfId) {
          const turfData = await fetchTurfById(turfId as string);
          if (!turfData || !turfData.organization) {
            throw new Error("Invalid turf data received");
          }
          setTurf(turfData);
          setEditedData({
            basePrice: turfData.basePrice,
            sports: turfData.sports,
            team_size: turfData.team_size,
            operatingHours: turfData.operatingHours || [],
          });
        }
      } catch (error) {
        console.error("Error loading turf:", error);
        toast.error("Failed to load turf details");
      } finally {
        setLoading(false);
      }
    };

    loadTurf();
  }, [turfId]);

  useEffect(() => {
    if (imagePreview.length > 0) {
      setActiveImage(0);
    } else if (turf && turf.images && turf.images.length > 0) {
      setActiveImage(0);
    }
  }, [imagePreview, turf]);

  useEffect(() => {
    if (isEditing) {
      const loadSportsAndTeamSizes = async () => {
        try {
          const [sportsData, teamSizesData] = await Promise.all([
            fetchSports(),
            fetchTeamSizes(),
          ]);
          setAvailableSports(sportsData);
          setAvailableTeamSizes(teamSizesData);
        } catch (error) {
          console.error("Error loading sports or team sizes:", error);
          toast.error("Failed to load sports or team sizes");
        }
      };
      loadSportsAndTeamSizes();
    }
  }, [isEditing]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSportToggle = (sportName: string) => {
    const currentSports = [...(editedData.sports || [])];
    if (currentSports.includes(sportName)) {
      setEditedData((prev) => ({
        ...prev,
        sports: (prev.sports || []).filter((s) => s !== sportName),
      }));
    } else {
      setEditedData((prev) => ({
        ...prev,
        sports: [...(prev.sports || []), sportName],
      }));
    }
  };

  const handleTeamSizeChange = (size: number) => {
    setEditedData((prev) => ({ ...prev, team_size: size }));
  };

  const handleOperatingHourChange = (
    day: number,
    field: "open" | "close",
    value: string
  ) => {
    setEditedData((prev) => {
      const updatedHours = [...(prev.operatingHours || [])];
      const dayIndex = updatedHours.findIndex((h) => h.day === day);

      if (dayIndex >= 0) {
        updatedHours[dayIndex] = { ...updatedHours[dayIndex], [field]: value };
      } else {
        updatedHours.push({ day, open: "", close: "", [field]: value });
      }

      return { ...prev, operatingHours: updatedHours };
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setNewImages(filesArray);

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
      setLoading(true);
      const formData = new FormData();

      if (editedData.basePrice !== undefined)
        formData.append("basePrice", editedData.basePrice.toString());
      if (editedData.sports)
        formData.append("sports", JSON.stringify(editedData.sports));
      if (editedData.team_size !== undefined)
        formData.append("team_size", editedData.team_size.toString());
      if (editedData.operatingHours)
        formData.append(
          "operatingHours",
          JSON.stringify(editedData.operatingHours)
        );

      if (newImages.length > 0) {
        newImages.forEach((image) => {
          formData.append("images", image);
        });
      }

      const updatedTurf = await updateTurf(turfId as string, formData);
      
      if (!updatedTurf || !updatedTurf.organization) {
        throw new Error("Invalid data received after update");
      }
      
      setTurf(updatedTurf);
      setIsEditing(false);
      setImagePreview([]);
      setNewImages([]);
      toast.success("Turf updated successfully!");
    } catch (error) {
      console.error("Error updating turf:", error);
      toast.error("Failed to update turf");
    } finally {
      setLoading(false);
    }
  };

  const getImageSrc = () => {
    if (imagePreview.length > 0 && activeImage < imagePreview.length) {
      return imagePreview[activeImage];
    } else if (turf?.images && turf.images.length > 0) {
      const validIndex = Math.min(activeImage, turf.images.length - 1);
      return turf.images[validIndex];
    }
    return "/placeholder-turf.jpg";
  };

  if (loading && !turf) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="animate-spin rounded-full h-14 w-14 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!turf) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-gray-600">
        <p className="text-lg">Turf Not Found</p>
        <button
          onClick={() => router.back()}
          className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
        >
          <FiArrowLeft /> Go Back
        </button>
      </div>
    );
  }

  const hasOrgData = turf.organization && turf.organization.location;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12"
    >
      {/* Breadcrumb navigation */}
      <nav className="flex items-center text-sm text-gray-500 mb-6">
        <Link
          href={`/organization/${organizationId}`}
          className="hover:text-blue-600 transition-colors flex items-center"
        >
          <FiHome className="inline mr-2" />
          <span>Dashboard</span>
        </Link>
        <span className="mx-2 text-gray-300">/</span>
        <Link
          href={`/organization/${organizationId}/view-turf`}
          className="hover:text-blue-600 transition-colors"
        >
          Turfs
        </Link>
        <span className="mx-2 text-gray-300">/</span>
        <span className="text-gray-900 font-medium truncate max-w-xs">
          {turf.name}
        </span>
      </nav>

      {/* Header with edit buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors px-4 py-2 rounded-lg hover:bg-blue-50"
        >
          <FiArrowLeft />
          <span>Back to Turfs</span>
        </button>

        {isEditing ? (
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={() => setIsEditing(false)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 transition disabled:opacity-50"
            >
              <FiX />
              <span>Cancel</span>
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50"
            >
              <FiSave />
              <span>{loading ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition shadow-md hover:shadow-lg"
          >
            <FiEdit2 />
            <span>Edit Turf</span>
          </button>
        )}
      </div>

      {/* Main content container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - Images and key info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Image gallery */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
            {/* Main image */}
            <div className="relative h-80 sm:h-96 w-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="h-full w-full"
                >
                  <Image
                    src={getImageSrc()}
                    alt={turf.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 66vw"
                    priority
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Thumbnails */}
            <div className="p-4 border-t border-gray-100">
              <div className="flex gap-3 overflow-x-auto pb-2">
                {imagePreview.length > 0
                  ? imagePreview.map((img, idx) => (
                      <button
                        key={`preview-${idx}`}
                        onClick={() => setActiveImage(idx)}
                        className={`relative h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                          activeImage === idx
                            ? "border-blue-500 ring-2 ring-blue-200"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <Image
                          src={img}
                          alt={`Preview ${idx + 1}`}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </button>
                    ))
                  : turf.images?.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImage(idx)}
                        className={`relative h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                          activeImage === idx
                            ? "border-blue-500 ring-2 ring-blue-200"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <Image
                          src={img}
                          alt={`${turf.name} ${idx + 1}`}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </button>
                    ))}
                
                {isEditing && (
                  <label className="relative h-20 w-20 flex-shrink-0 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors flex items-center justify-center cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      multiple
                      className="hidden"
                    />
                    <div className="text-center p-2">
                      <FiImage className="mx-auto text-gray-400 mb-1" />
                      <span className="text-xs text-gray-500">Add Images</span>
                    </div>
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Turf details */}
          <div className="bg-white rounded-xl shadow-md p-6 space-y-6 border border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {turf.name}
              </h1>
            </div>

            {hasOrgData && (
              <div className="flex items-start text-gray-700">
                <FiMapPin className="mt-1 mr-3 text-blue-600 flex-shrink-0" />
                <p className="text-gray-800">
                  {turf.organization.location.address}
                  {turf.organization.location.area && `, ${turf.organization.location.area}`}
                  {turf.organization.location.city && `, ${turf.organization.location.city}`}
                </p>
              </div>
            )}

            <div className="space-y-6">
              {/* Operating Hours */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-full text-blue-600">
                    <FiClock />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Operating Hours
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {DAYS.map((dayName, dayIndex) => {
                    const hours = isEditing
                      ? editedData.operatingHours?.find((h) => h.day === dayIndex) ||
                        (turf.operatingHours || []).find((h) => h.day === dayIndex) || 
                        { day: dayIndex, open: "", close: "" }
                      : (turf.operatingHours || []).find((h) => h.day === dayIndex) || 
                        { day: dayIndex, open: "Closed", close: "Closed" };

                    return (
                      <OperatingHourItem
                        key={dayIndex}
                        day={dayName}
                        hours={hours}
                        today={dayIndex === today}
                        isEditing={isEditing}
                        onChange={(field, value) =>
                          handleOperatingHourChange(dayIndex, field, value)
                        }
                      />
                    );
                  })}
                </div>
              </div>

              {/* Pricing and Team Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {isEditing ? (
                  <div className="bg-gray-50/50 border border-gray-100 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-blue-50 rounded-full text-blue-600">
                        <FiDollarSign />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">
                          Base Price
                        </h4>
                        <div className="relative mt-1">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                            ৳
                          </span>
                          <input
                            type="number"
                            name="basePrice"
                            value={editedData.basePrice || turf.basePrice}
                            onChange={handleInputChange}
                            className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <DetailItem
                    icon={<FiDollarSign />}
                    label="Base Price"
                    value={`৳${turf.basePrice}/hour`}
                  />
                )}

                {isEditing ? (
                  <div className="bg-gray-50/50 border border-gray-100 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-blue-50 rounded-full text-blue-600">
                        <FiUsers />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">
                          Team Size
                        </h4>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {availableTeamSizes.map((size) => (
                            <button
                              key={size._id}
                              type="button"
                              onClick={() => handleTeamSizeChange(size.name)}
                              className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                                editedData.team_size === size.name
                                  ? "bg-blue-600 text-white shadow-md"
                                  : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                              }`}
                            >
                              {size.name} players
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <DetailItem
                    icon={<FiUsers />}
                    label="Team Size"
                    value={`${turf.team_size} players per team`}
                  />
                )}
              </div>

              {/* Sports Available */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-full text-blue-600">
                    <FiPlus />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Sports Available
                  </h3>
                </div>
                
                {isEditing ? (
                  <div className="flex flex-wrap gap-2">
                    {availableSports.map((sport) => (
                      <button
                        key={sport._id}
                        type="button"
                        onClick={() => handleSportToggle(sport.name)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                          editedData.sports?.includes(sport.name)
                            ? "bg-blue-600 text-white shadow-md"
                            : "bg-gray-100 hover:bg-gray-200 text-gray-800"
                        }`}
                      >
                        {sport.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(turf.sports || []).map((sport, idx) => (
                      <span
                        key={idx}
                        className="px-4 py-2 bg-blue-100 text-blue-800 font-medium rounded-lg"
                      >
                        {sport}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Facilities */}
              {hasOrgData && turf.organization.facilities && turf.organization.facilities.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-full text-blue-600">
                      <FiPlus />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Available Facilities
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {turf.organization.facilities.map((facility, idx) => (
                      <span
                        key={idx}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-800 text-sm rounded-lg"
                      >
                        {facility}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column - Contact and booking info */}
        <div className="space-y-6">
          {/* Contact info */}
          {hasOrgData && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-5">
                Contact Information
              </h3>
              <div className="space-y-5">
                {turf.organization.orgContactPhone && (
                  <div className="flex items-start">
                    <div className="p-2 bg-blue-50 rounded-full text-blue-600 mr-3">
                      <FiPhone />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Phone</p>
                      <a
                        href={`tel:${turf.organization.orgContactPhone}`}
                        className="text-gray-900 hover:text-blue-600 transition-colors"
                      >
                        {turf.organization.orgContactPhone}
                      </a>
                    </div>
                  </div>
                )}

                {turf.organization.orgContactEmail && (
                  <div className="flex items-start">
                    <div className="p-2 bg-blue-50 rounded-full text-blue-600 mr-3">
                      <FiMail />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Email</p>
                      <a
                        href={`mailto:${turf.organization.orgContactEmail}`}
                        className="text-gray-900 hover:text-blue-600 transition-colors"
                      >
                        {turf.organization.orgContactEmail}
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex items-start">
                  <div className="p-2 bg-blue-50 rounded-full text-blue-600 mr-3">
                    <FiMapPin />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Location</p>
                    <p className="text-gray-900">
                      {turf.organization.location.address}
                    </p>
                    {(turf.organization.location.city || turf.organization.location.post_code) && (
                      <p className="text-gray-900">
                        {turf.organization.location.city}
                        {turf.organization.location.post_code && `, ${turf.organization.location.post_code}`}
                      </p>
                    )}

                    {turf.organization.location.coordinates && (
                      <a
                        href={generateBariKoiMapLink(
                          turf.organization.location.coordinates.coordinates[1],
                          turf.organization.location.coordinates.coordinates[0]
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors text-sm"
                      >
                        <FiMapPin />
                        View on Barikoi Maps
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Reviews summary */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-gray-900">Reviews</h3>
              <div className="flex items-center bg-blue-50 text-blue-800 px-3 py-1 rounded-full">
                <FiStar className="mr-1 text-yellow-500" />
                <span className="text-sm font-medium">
                  {turf.reviews?.length || 0} reviews
                </span>
              </div>
            </div>
            {turf.reviews && turf.reviews.length > 0 ? (
              <p className="text-gray-600">
                This turf has received {turf.reviews.length} reviews from users.
              </p>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-3">No reviews yet for this turf.</p>
                <button className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium">
                  Be the first to review
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}