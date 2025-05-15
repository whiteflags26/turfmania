"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useAuth } from "@/lib/contexts/authContext"; 
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import TimeSlotGrid from "@/components/booking/TimeSlotGrid";
import { ITimeSlot } from "@/types/timeslot";
import { fetchAvailableTimeSlots as fetchAvailableTimeSlotsAPI } from "@/lib/server-apis/booking/fetchAvailableTimeSlot-api";
import { createBooking } from "@/lib/server-apis/booking/createBooking-api";

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
  const router = useRouter();
  const { user } = useAuth(); 
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeSlots, setTimeSlots] = useState<ITimeSlot[]>([]);

  // We're enhancing to support multiple slot selection
  const [selectedSlots, setSelectedSlots] = useState<ITimeSlot[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [transactionId, setTransactionId] = useState("");
  const [turfBasePrice, setTurfBasePrice] = useState(0);

  useEffect(() => {
    if (isOpen && !user) {
      // User is not authenticated, close modal and redirect to sign-in
      onClose();
      toast.error("Please sign in to book a turf");
      setTimeout(() => {
        router.push('/sign-in');
      }, 1500);
    }
  }, [isOpen, user, onClose, router]);

  // Fetch time slots when date changes
  useEffect(() => {
    if (isOpen && turfId && selectedDate) {
      fetchAvailableTimeSlots();
    }
  }, [isOpen, turfId, selectedDate]);

  // Fetch turf details when modal opens
  useEffect(() => {
    if (isOpen && turfId) {
      fetchTurfDetails();
    }
  }, [isOpen, turfId]);

  // Calculate totals when selected slots change
  useEffect(() => {
    if (selectedSlots.length > 0) {
      // Get the price from the turf's basePrice
      const pricePerSlot = turfBasePrice || 0; // Using the basePrice of the turf
      const total = selectedSlots.length * pricePerSlot;

      setTotalAmount(total);
      // Calculate 65% for advance payment (rounded to 2 decimal places)
      setAdvanceAmount(Math.round(total * 0.65 * 100) / 100);
    } else {
      setTotalAmount(0);
      setAdvanceAmount(0);
    }
  }, [selectedSlots, turfBasePrice]);

  const fetchAvailableTimeSlots = async () => {
    setIsLoading(true);
    try {
      const response = await fetchAvailableTimeSlotsAPI(turfId, selectedDate);

      if (response.success) {
        setTimeSlots(response.data);
      } else {
        toast.error(response.message ?? "Failed to fetch time slots");
      }
    } catch (error) {
      console.error("Error fetching available time slots:", error);
      toast.error("Failed to fetch available time slots");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTurfDetails = async () => {
    try {
      const response = await fetch(
        `/api/v1/turf/${turfId}`,
        {
          credentials: "include",
        }
      );

      const data = await response.json();

      if (data.success) {
        setTurfBasePrice(data.data.basePrice);
      } else {
        toast.error("Failed to fetch turf details");
      }
    } catch (error) {
      console.error("Error fetching turf details:", error);
      toast.error("Failed to fetch turf details");
    }
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      // Clear selections when date changes
      setSelectedSlots([]);
    }
  };

  const handleSlotSelect = (slot: ITimeSlot) => {
    setSelectedSlots((prev) => {
      // Check if slot is already selected
      const isSelected = prev.some((s) => s._id === slot._id);

      if (isSelected) {
        // Remove from selection
        return prev.filter((s) => s._id !== slot._id);
      } else {
        // Add to selection
        return [...prev, slot];
      }
    });
  };

  const handleContinue = () => {
    if (selectedSlots.length === 0) {
      toast.error("Please select at least one time slot");
      return;
    }
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = async () => {
    if (!transactionId.trim()) {
      toast.error("Please provide a transaction ID for your payment");
      return;
    }

    setIsSubmitting(true);
    try {
      const bookingData = {
        turfId,
        timeSlotIds: selectedSlots.map((slot) => slot._id),
        advancePaymentTransactionId: transactionId.trim(),
      };

      const result = await createBooking(bookingData);

      if (result.success) {
        toast.success(result.message || "Booking successful! Your booking has been confirmed");

        // Reset form and close modal
        resetForm();
        onClose();

        // Redirect to bookings page or refresh
        setTimeout(() => {
          router.refresh();
          router.push(`/venues/${turfId}`);
        }, 2000);
      } else {
        console.error("Booking error:", result.message);
        toast.error(result.message || "Failed to create booking");
      }
    } catch (error) {
      // Improved error handling with specific cases
      if (error instanceof Error) {
        if (error.message.includes("User is not verified")) {
          toast.error("Your account is not verified. Please go to your profile page and request a verification email.");
          // Optionally redirect to profile page
          setTimeout(() => router.push("/profile"), 2000);
        } else if (error.message.includes("Not authorized")) {
          toast.error("Please sign in to book a turf");
          // Redirect to sign-in page
          setTimeout(() => router.push("/sign-in"), 2000);
        } else {
          toast.error(error.message || "Booking failed");
        }
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setSelectedSlots([]);
    setTransactionId("");
    setTotalAmount(0);
    setAdvanceAmount(0);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Helper to display selected slots
  const renderSelectedSlots = () => {
    return selectedSlots.map((slot) => (
      <div
        key={slot._id}
        className="bg-muted border px-3 py-1 rounded-full text-xs flex items-center"
      >
        {format(new Date(slot.start_time), "h:mm a")} -{" "}
        {format(new Date(slot.end_time), "h:mm a")}
        <Button
          variant="ghost"
          size="icon"
          className="h-4 w-4 ml-1"
          onClick={() => handleSlotSelect(slot)}
        >
          ✕
        </Button>
      </div>
    ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {step === 1 ? "Book Your Turf Slot" : "Complete Your Booking"}
          </DialogTitle>
        </DialogHeader>

        {step === 1 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="flex flex-col space-y-4">
                <h3 className="font-medium">Select Date</h3>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateChange}
                  className="border rounded-md p-3"
                  disabled={(date) =>
                    date < new Date(new Date().setHours(0, 0, 0, 0))
                  }
                />
              </div>
              <div className="flex flex-col space-y-4">
                <h3 className="font-medium">Available Time Slots</h3>
                <div className="h-[300px] overflow-y-auto border rounded-md p-3">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : timeSlots.length > 0 ? (
                    <TimeSlotGrid
                      timeSlots={timeSlots}
                      selectedSlot={null} // We'll handle selection differently
                      onSelect={handleSlotSelect}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No available slots for this date
                    </div>
                  )}
                </div>
              </div>
            </div>

            {selectedSlots.length > 0 && (
              <div className="mt-6 space-y-4">
                <Separator />
                <div>
                  <h3 className="font-medium mb-2">Selected Time Slots</h3>
                  <div className="flex flex-wrap gap-2">
                    {renderSelectedSlots()}
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="font-medium">Total Amount:</span>
                  <span className="font-medium">৳{totalAmount.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-primary">
                  <span className="font-medium">Advance Payment (65%):</span>
                  <span className="font-medium">
                    ৳{advanceAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Total Amount</Label>
              <Input
                id="amount"
                value={`৳${totalAmount.toFixed(2)}`}
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="advanceAmount">Advance Payment (65%)</Label>
              <Input
                id="advanceAmount"
                value={`৳${advanceAmount.toFixed(2)}`}
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transactionId">Payment Transaction ID</Label>
              <Input
                id="transactionId"
                placeholder="Enter your payment transaction ID"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Please complete the advance payment of ৳
                {advanceAmount.toFixed(2)} via bKash/Nagad and enter the
                Transaction ID here.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Booking Summary</Label>
              <div className="bg-muted p-3 rounded-md text-sm space-y-2">
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{format(selectedDate, "PPP")}</span>
                </div>
                <div>
                  <div>Time Slots:</div>
                  <div className="ml-2 mt-1">
                    {selectedSlots.map((slot) => (
                      <div key={slot._id}>
                        {format(new Date(slot.start_time), "h:mm a")} -{" "}
                        {format(new Date(slot.end_time), "h:mm a")}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-between mt-4">
          {step === 2 ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isSubmitting}
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing
                  </>
                ) : (
                  "Confirm Booking"
                )}
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleContinue}
                disabled={selectedSlots.length === 0}
              >
                Continue to Payment
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
