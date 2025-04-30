"use client";

import { FiClock, FiCalendar } from "react-icons/fi";
import { motion } from "framer-motion";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface TimeslotListProps {
  slots: any[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export default function TimeslotList({
  slots,
  selectedDate,
  onDateChange,
}: TimeslotListProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-700">Available Timeslots</h4>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <FiCalendar />
          </div>
          <DatePicker
            selected={selectedDate}
            onChange={(date: Date | null) => date && onDateChange(date)}
            minDate={new Date()}
            className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          />
        </div>
      </div>

      {slots.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {slots.map((slot) => (
            <motion.div
              key={slot._id}
              whileHover={{ scale: 1.02 }}
              className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2 text-gray-700">
                <FiClock className="text-blue-500" />
                <span className="font-medium">
                  {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                </span>
              </div>
              <div className="mt-1 text-sm text-gray-500">
                Status: <span className="text-green-600">Available</span>
              </div>
              {slot.price_override && (
                <div className="mt-1 text-sm">
                  Price: ${slot.price_override.toFixed(2)}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 bg-gray-100 rounded-lg text-gray-500">
          No timeslots available for selected date
        </div>
      )}
    </div>
  );
}
