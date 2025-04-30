"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import TurfCard from "@/components/timeslot/TurfCard";
import TimeslotForm from "@/components/timeslot/TimeslotForm";
import { FiPlus, FiClock } from "react-icons/fi";
import { fetchTurfsByOrganizationId } from "@/lib/server-apis/turf-timeslot/getTurfbyOrganizationId-api";
import { Turf } from "@/types/timeslot";
import { toast } from "react-hot-toast";
import { getAvailableTimeSlots } from "@/lib/server-apis/turf-timeslot/timeslotService-apis";
import TimeslotList from "@/components/timeslot/TimeslotList";

interface TurfSelectionProps {
  organizationId: string;
}

export default function TurfSelection({ organizationId }: TurfSelectionProps) {
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [selectedTurfId, setSelectedTurfId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [generatedSlots, setGeneratedSlots] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTurfs = async () => {
      try {
        setLoading(true);
        const response = await fetchTurfsByOrganizationId(organizationId);
        if (response.success) {
          setTurfs(response.data);
          if (response.data.length > 0) {
            setSelectedTurfId(response.data[0]._id);
          }
        } else {
          setError("Failed to fetch turfs");
        }
      } catch (err) {
        setError("An error occurred while fetching turfs");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadTurfs();
  }, [organizationId]);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const loadGeneratedSlots = async () => {
    if (!selectedTurfId) return;

    try {
      const response = await getAvailableTimeSlots(
        selectedTurfId,
        selectedDate
      );
      if (response.success) {
        setGeneratedSlots(response.data);
      }
    } catch (error) {
      console.error("Error loading timeslots:", error);
      toast.error("Failed to load timeslots");
    }
  };

  const handleGenerationSuccess = () => {
    setShowForm(false);
    loadGeneratedSlots();
  };

  useEffect(() => {
    if (selectedTurfId) {
      loadGeneratedSlots();
    }
  }, [selectedTurfId, selectedDate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="animate-spin rounded-full h-14 w-14 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  if (turfs.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 text-blue-600 p-4 rounded-lg">
        No turfs found for this organization
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {turfs.map((turf) => (
          <motion.div
            key={turf._id}
            whileHover={{ scale: 1.03 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <TurfCard
              turf={turf}
              isSelected={selectedTurfId === turf._id}
              onSelect={() => setSelectedTurfId(turf._id)}
            />
          </motion.div>
        ))}
      </div>

      {selectedTurfId && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 bg-gray-50 p-6 rounded-xl border border-gray-200"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-full text-blue-600">
              <FiClock className="text-lg" />
            </div>
            <h3 className="text-lg font-medium text-gray-800">
              Timeslot Management for{" "}
              {turfs.find((t) => t._id === selectedTurfId)?.name}
            </h3>
          </div>

          {!showForm ? (
            <div className="space-y-4">
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <FiPlus />
                <span>Generate New Timeslots</span>
              </button>

              <TimeslotList
                slots={generatedSlots}
                selectedDate={selectedDate}
                onDateChange={handleDateChange}
              />
            </div>
          ) : (
            <TimeslotForm
              turfId={selectedTurfId}
              onSuccess={handleGenerationSuccess}
            />
          )}
        </motion.div>
      )}
    </div>
  );
}