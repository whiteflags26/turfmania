"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { FiBriefcase, FiFilter, FiSearch, FiPlus } from "react-icons/fi";
import TurfGrid from "@/components/turfs/TurfGrid";
import { ITurf } from "@/types/turf";
import { fetchTurfsByOrganization } from "@/lib/server-apis/view-turfs/fetchTurfsbyOrganization-api";
import { createTurf } from "@/lib/server-apis/view-turfs/createTurf-api";
import { deleteTurf } from "@/lib/server-apis/view-turfs/deleteTurf-api";
import CreateTurfModal from "@/components/turfs/CreateTurfModal";

export default function ViewTurfsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [turfs, setTurfs] = useState<ITurf[]>([]);
  const [filteredTurfs, setFilteredTurfs] = useState<ITurf[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSport, setSelectedSport] = useState<string>("");
  const [organizationName, setOrganizationName] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Get all available sports from the turfs
  const availableSports = [...new Set(turfs.flatMap((turf) => turf.sports))];

  const loadTurfs = async () => {
    try {
      setLoading(true);
      const fetchedTurfs = await fetchTurfsByOrganization(id as string);
      setTurfs(fetchedTurfs);
      setFilteredTurfs(fetchedTurfs);

      // Set organization name if there are turfs
      if (fetchedTurfs.length > 0) {
        setOrganizationName(fetchedTurfs[0].organization.name);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load turfs");
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (id) {
      loadTurfs();
    }
  }, [id]);

  useEffect(() => {
    // Filter turfs based on search term and selected sport
    let filtered = [...turfs];

    if (searchTerm) {
      filtered = filtered.filter(
        (turf) =>
          turf.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          turf.organization.location.address
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    if (selectedSport) {
      filtered = filtered.filter((turf) => turf.sports.includes(selectedSport));
    }

    setFilteredTurfs(filtered);
  }, [searchTerm, selectedSport, turfs]);

  const handleDeleteTurf = async (turfId: string) => {
    if (window.confirm("Are you sure you want to delete this turf? This action cannot be undone.")) {
      try {
        setLoading(true);
        await deleteTurf(turfId);
        toast.success("Turf deleted successfully");
        loadTurfs(); // Reload the turf list after deletion
      } catch (error) {
        console.error(error);
        toast.error("Failed to delete turf");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCreateTurf = async (formData: FormData) => {
    try {
      setLoading(true);
      await createTurf(id as string, formData);
      toast.success("Turf created successfully");
      setIsCreateModalOpen(false);
      loadTurfs(); // Reload the turf list after creation
    } catch (error) {
      console.error(error);
      toast.error("Failed to create turf");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-6 py-10"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Turfs
          </h1>
          {organizationName && (
            <div className="flex items-center mt-2 text-gray-600">
              <FiBriefcase className="mr-2" />
              <span>{organizationName}</span>
            </div>
          )}
        </div>
        
        {/* Add Create Turf Button */}
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <FiPlus /> Create Turf
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name or location..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 sm:text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="w-full md:w-48">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiFilter className="text-gray-400" />
              </div>
              <select
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 sm:text-sm"
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
              >
                <option value="">All Sports</option>
                {availableSports.map((sport) => (
                  <option key={sport} value={sport}>
                    {sport}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Turf Cards */}
      <TurfGrid 
        turfs={filteredTurfs} 
        loading={loading} 
        onDelete={handleDeleteTurf}
      />

      {/* Create Turf Modal */}
      {isCreateModalOpen && (
        <CreateTurfModal 
          onClose={() => setIsCreateModalOpen(false)} 
          onSubmit={handleCreateTurf}
          organizationId={id as string}
        />
      )}
    </motion.div>
  );
}
