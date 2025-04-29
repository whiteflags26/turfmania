'use client';

import { useState } from 'react';
import { FiCalendar, FiClock, FiSave, FiX } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { generateTimeSlots } from '@/lib/server-apis/turf-timeslot/timeslotService-apis';

interface TimeslotFormProps {
  turfId: string;
  onSuccess: () => void;
}

export default function TimeslotForm({ turfId, onSuccess }: TimeslotFormProps) {
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    slotDuration: 60,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'slotDuration' ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.startDate || !formData.endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      toast.error('End date must be after start date');
      return;
    }

    if (formData.slotDuration < 30 || formData.slotDuration > 240) {
      toast.error('Slot duration must be between 30 and 240 minutes');
      return;
    }

    try {
      setIsSubmitting(true);
      await generateTimeSlots({
        turfId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        slotDuration: formData.slotDuration,
      });
      toast.success('Timeslots generated successfully!');
      onSuccess();
      setFormData({
        startDate: '',
        endDate: '',
        slotDuration: 60,
      });
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate timeslots');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Start Date */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <FiCalendar className="text-blue-600" />
            Start Date
          </label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            min={new Date().toISOString().split('T')[0]}
            required
          />
        </div>

        {/* End Date */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <FiCalendar className="text-blue-600" />
            End Date
          </label>
          <input
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            min={formData.startDate || new Date().toISOString().split('T')[0]}
            required
          />
        </div>
      </div>

      {/* Slot Duration */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <FiClock className="text-blue-600" />
          Slot Duration (minutes)
        </label>
        <input
          type="number"
          name="slotDuration"
          min="30"
          max="240"
          step="15"
          value={formData.slotDuration}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          Must be between 30-240 minutes (in 15 minute increments)
        </p>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={() => {
            setFormData({
              startDate: '',
              endDate: '',
              slotDuration: 60,
            });
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
        >
          <FiX className="inline mr-2" />
          Reset
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiSave className="inline mr-2" />
          {isSubmitting ? 'Generating...' : 'Generate Timeslots'}
        </button>
      </div>
    </motion.form>
  );
}