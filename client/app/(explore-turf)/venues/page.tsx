"use client";

import { useEffect, useState } from "react";
import { fetchTurfs } from "@/lib/server-apis/fetchTurf-api";
import TurfFilters from "@/components/turfs/TurfFilters";
import TurfGrid from "@/components/turfs/TurfGrid";
import TurfPagination from "@/components/turfs/TurfPagination";
import HeroSection from "@/components/turfs/TurfHeroSection";
import ErrorAlert from "@/components/turfs/TurfErrorAlert";


export interface Turf {
  _id: string;
  name: string;
  basePrice: number;
  sports: string[];
  team_size: number;
  images: string[];
  operatingHours: Array<{
    day: number;
    open: string;
    close: string;
  }>;
  organization: {
    name: string;
    facilities: string[];
    location: {
      address: string;
      city: string;
      coordinates: [number, number];
    };
  };
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalResults: number;
}

export default function TurfExplorePage() {
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [allTurfs, setAllTurfs] = useState<Turf[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalResults: 0,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minPrice: "",
    maxPrice: "",
    sports: [] as string[],
    teamSize: [] as string [],
    facilities: [] as string[],
    radius: "5",
    latitude: "",
    longitude: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedTurf, setSelectedTurf] = useState<Turf | null>(null);

  const loadTurfs = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchTurfs(filters, {
        currentPage: pagination.currentPage,
        limit: 9,
      });
      setTurfs(result.data);
      if (allTurfs.length === 0) {
        const allData = await fetchTurfs({}, { currentPage: 1, limit: 1000 }); // fetch unfiltered
        setAllTurfs(allData.data);
      }
      
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load turfs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTurfs();
    }, 800);
    return () => clearTimeout(timer);
  }, [filters, pagination.currentPage]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-gradient-to-b from-white to-slate-50 min-h-screen">
      <HeroSection />
      <ErrorAlert error={error} setError={setError} />
      <TurfFilters
        turfs={allTurfs}
        filters={filters}
        setFilters={setFilters}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setPagination={setPagination}
      />
      <TurfGrid
        loading={loading}
        turfs={turfs}
        filters={filters}
        pagination={pagination}
        selectedTurf={selectedTurf}
        setSelectedTurf={setSelectedTurf}
        resetFilters={() => {
          setFilters({
            minPrice: "",
            maxPrice: "",
            sports: [],
            teamSize: [],
            facilities: [],
            radius: "5",
            latitude: "",
            longitude: "",
          });
          setActiveTab("all");
        }}
      />
      <TurfPagination pagination={pagination} setPagination={setPagination} />
    </div>
  );
}
