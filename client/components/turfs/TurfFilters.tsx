import { Dispatch, SetStateAction } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/Button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Filter, MapPin, Users, Lightbulb, Clock, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Turf } from "@/app/(explore-turf)/venues/page";
import { DualRangeSlider } from "@/components/ui/dual-range-slider";
import TimeFilterCard from "@/components/turfs/TimeFilterCard";
import { autocomplete } from "barikoiapis";
import { useEffect, useState } from "react";
import "@/lib/config/barikoiConfig";

interface Props {
  turfs: Turf[];
  filters: any;
  setFilters: Dispatch<SetStateAction<any>>;
  showFilters: boolean;
  setShowFilters: Dispatch<SetStateAction<boolean>>;
  activeTab: string;
  setActiveTab: Dispatch<SetStateAction<string>>;
  setPagination: Dispatch<SetStateAction<any>>;
}

const filterVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: { opacity: 1, height: "auto" },
};

export default function TurfFilters({
  turfs,
  filters,
  setFilters,
  showFilters,
  setShowFilters,
  activeTab,
  setActiveTab,
  setPagination,
}: Props) {
  const uniqueSports = Array.from(
    new Set(
      turfs.flatMap((turf) =>
        turf.sports.map(
          (sport: string) =>
            sport.charAt(0).toUpperCase() + sport.slice(1).toLowerCase()
        )
      )
    )
  ).sort();

  const uniqueTeamSizes = Array.from(
    new Set(turfs?.map((t) => t.team_size))
  ).sort((a, b) => a - b);

  const handleSportFilter = (sport: string) => {
    setActiveTab(sport.toLowerCase());
    setFilters({ ...filters, sports: sport === "all" ? [] : [sport] });
    setPagination((prev: any) => ({ ...prev, currentPage: 1 }));
  };

  const uniqueFacilities = Array.from(
    new Set(turfs.flatMap((turf) => turf.organization?.facilities || []))
  ).sort();

  const handleGeoLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFilters({
            ...filters,
            latitude: pos.coords.latitude.toString(),
            longitude: pos.coords.longitude.toString(),
          });
        },
        () => alert("Please enable location access to use this feature")
      );
    }
  };

  const handleTimeFilter = (data: {
    date: string;
    startTime: string;
    endTime: string;
  }) => {
    setFilters((prev) => ({
      ...prev,
      preferredDate: data.date,
      preferredTimeStart: data.startTime,
      preferredTimeEnd: data.endTime,
    }));
  };

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 3) {
        setSuggestions([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const res = await autocomplete({ q: query });
        setSuggestions(res.places || []);
      } catch (err) {
        console.error("Barikoi error:", err);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const timeout = setTimeout(fetchSuggestions, 300); // debounce
    return () => clearTimeout(timeout);
  }, [query]);

  const handleLocationSelect = (place: any) => {
    setFilters({
      ...filters,
      latitude: place.latitude.toString(),
      longitude: place.longitude.toString(),
    });
    setQuery(place.address);
    setSuggestions([]);
  };

  return (
    <div className="mb-8">
      <Tabs defaultValue="all" value={activeTab} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="bg-slate-100">
            <TabsTrigger value="all" onClick={() => handleSportFilter("all")}>
              All Turfs
            </TabsTrigger>
            {uniqueSports.map((sport) => (
              <TabsTrigger
                key={sport}
                value={sport.toLowerCase()}
                onClick={() => handleSportFilter(sport)}
              >
                {sport}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1"
            >
              {showFilters ? <X size={16} /> : <Filter size={16} />}
              <span className="hidden sm:inline">
                {showFilters ? "Hide Filters" : "More Filters"}
              </span>
            </Button>
          </div>
        </div>
      </Tabs>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            variants={filterVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="mb-8 overflow-hidden"
          >
            <div className="flex justify-end mb-4">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setFilters({
                    sports: [],
                    teamSize: [],
                    facilities: [],
                    minPrice: "0",
                    maxPrice: "10000",
                    preferredDate: "",
                    preferredTimeStart: "",
                    preferredTimeEnd: "",
                    latitude: "",
                    longitude: "",
                    radius: "",
                  });
                  setPagination((prev: any) => ({ ...prev, currentPage: 1 }));
                  setQuery("");
                  setSuggestions([]);
                }}
              >
                Clear Filters
              </Button>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Price Range */}
                  <div className="space-y-4">
                    <h3 className="font-medium flex items-center gap-2">
                      <span className="bg-green-100 p-1.5 rounded-full">৳</span>{" "}
                      Price Range
                    </h3>
                    <div className="px-2">
                      <DualRangeSlider
                        min={0}
                        max={10000}
                        step={100}
                        value={[
                          Number(filters.minPrice) || 0,
                          Number(filters.maxPrice) || 5000,
                        ]}
                        onValueChange={(val) => {
                          setFilters({
                            ...filters,
                            minPrice: val[0].toString(),
                            maxPrice: val[1].toString(),
                          });
                        }}
                      />
                      <div className="flex justify-between mt-2 text-sm text-slate-500">
                        <span>৳{filters.minPrice || "0"}</span>
                        <span>৳{filters.maxPrice || "10000"}</span>
                      </div>
                    </div>
                  </div>
                  {/* Team Size */}
                  <div className="space-y-4">
                    <h3 className="font-medium flex items-center gap-2">
                      <Users size={15} /> Team Size
                    </h3>
                    <div className="grid grid-cols-5 gap-2">
                      {uniqueTeamSizes.map((size) => (
                        <Button
                          key={size}
                          variant={
                            filters.teamSize.includes(size.toString())
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() => {
                            const newTeamSize = filters.teamSize.includes(
                              size.toString()
                            )
                              ? filters.teamSize.filter(
                                  (s: string) => s !== size.toString()
                                )
                              : [...filters.teamSize, size.toString()];

                            setFilters({
                              ...filters,
                              teamSize: newTeamSize,
                            });
                            setPagination((prev: any) => ({
                              ...prev,
                              currentPage: 1,
                            }));
                          }}
                        >
                          {size}v{size}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Facilities */}
                  <div className="space-y-4">
                    <h3 className="font-medium flex items-center gap-2">
                      <Lightbulb size={15} /> Facilities
                    </h3>
                    <div className="flex flex-wrap gap-2 ">
                      {uniqueFacilities.map((facility) => (
                        <Button
                          key={facility}
                          variant={
                            filters.facilities.includes(facility)
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          className="whitespace-normal break-words text-xs px-3 py-2 text-center h-auto min-w-[6rem] max-w-[10rem]"
                          onClick={() => {
                            const updatedFacilities =
                              filters.facilities.includes(facility)
                                ? filters.facilities.filter(
                                    (f) => f !== facility
                                  )
                                : [...filters.facilities, facility];

                            setFilters({
                              ...filters,
                              facilities: updatedFacilities,
                            });
                            setPagination((prev: any) => ({
                              ...prev,
                              currentPage: 1,
                            }));
                          }}
                        >
                          {facility}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Time & Date Filter */}
                  <div className="space-y-4">
                    <h3 className="font-medium flex items-center gap-2">
                      <Clock size={15} /> Available Time
                    </h3>
                    <TimeFilterCard onFilterApply={handleTimeFilter} />
                  </div>

                  {/* Location Filter */}
                  <div className="space-y-4">
                    <h3 className="font-medium flex items-center gap-2">
                      <MapPin size={15} /> Location
                    </h3>

                    <div className="space-y-3">
                      {/* Use My Location Button */}
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full flex items-center justify-center gap-2"
                        onClick={handleGeoLocation}
                      >
                        <MapPin size={14} /> Use My Location
                      </Button>

                      {/* Location Search Input */}
                      <div className="relative">
                        <Input
                          type="text"
                          placeholder="Search location..."
                          className="w-full pr-10"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                        />

                        {isLoading && (
                          <div className="absolute inset-y-0 right-3 flex items-center">
                            <svg
                              className="w-4 h-4 text-slate-500 animate-spin"
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
                                d="M4 12a8 8 0 018-8v4l3.5-3.5L12 0v4a8 8 0 11-8 8z"
                              ></path>
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Suggestions List */}
                      {suggestions.length > 0 && (
                        <div className="border rounded bg-white shadow-md max-h-48 overflow-y-auto divide-y text-sm">
                          {suggestions.map((place) => (
                            <div
                              key={place.id}
                              className="p-3 cursor-pointer hover:bg-slate-100 transition rounded-sm"
                              onClick={() => handleLocationSelect(place)}
                            >
                              {place.address}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Radius Input */}
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          placeholder="Radius (km)"
                          className="w-full"
                          value={filters.radius}
                          onChange={(e) =>
                            setFilters({ ...filters, radius: e.target.value })
                          }
                        />
                        <span className="text-sm text-slate-500">km</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
