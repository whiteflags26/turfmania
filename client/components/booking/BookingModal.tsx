'use client';
import TimeSlotGrid from '@/components/booking/TimeSlotGrid';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { fetchAvailableTimeSlots as fetchAvailableTimeSlotsAPI } from '@/lib/server-apis/booking/fetchAvailableTimeSlot-api';
import { ITimeSlot } from '@/types/timeslot';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  turfId: string;
}

export default function BookingModal({
  isOpen,
  onClose,
  turfId,
}: BookingModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [timeSlots, setTimeSlots] = useState<ITimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<ITimeSlot | null>(null);

  useEffect(() => {
    if (isOpen && turfId && selectedDate) {
      fetchAvailableTimeSlots();
    }
  }, [isOpen, turfId, selectedDate]);

  const fetchAvailableTimeSlots = async () => {
    setIsLoading(true);
    try {
      const response = await fetchAvailableTimeSlotsAPI(turfId, selectedDate);

      if (response.success) {
        setTimeSlots(response.data);
      } else {
        console.error('Failed to fetch time slots');
      }
    } catch (error) {
      console.error('Error fetching time slots:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setSelectedSlot(null);
    }
  };

  const handleSlotSelect = (slot: ITimeSlot) => {
    setSelectedSlot(slot);
  };

  const handleBooking = () => {
    if (selectedSlot) {
      // Implement booking logic here
      console.log('Booking slot:', selectedSlot);
      onClose();
    }
  };

  let slotContent;
  if (isLoading) {
    slotContent = (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  } else if (timeSlots.length > 0) {
    slotContent = (
      <TimeSlotGrid
        timeSlots={timeSlots}
        selectedSlot={selectedSlot}
        onSelect={handleSlotSelect}
      />
    );
  } else {
    slotContent = (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No available slots for this date
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Book Your Turf Slot
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div className="flex flex-col space-y-4">
            <h3 className="font-medium">Select Date</h3>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateChange}
              className="border rounded-md p-3"
              disabled={date =>
                date < new Date(new Date().setHours(0, 0, 0, 0))
              }
            />
          </div>
          <div className="flex flex-col space-y-4">
            <h3 className="font-medium">Available Time Slots</h3>
            <div className="h-[300px] overflow-y-auto border rounded-md p-3">
              {slotContent}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!selectedSlot} onClick={handleBooking}>
            Confirm Booking
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
