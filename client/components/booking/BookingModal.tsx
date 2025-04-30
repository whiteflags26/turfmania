"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
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
import { useToast  } from "@/hooks/use-toast";
import TimeSlotGrid from "@/components/booking/TimeSlotGrid";
import { ITimeSlot } from "@/types/timeslot";
import { fetchAvailableTimeSlots as fetchAvailableTimeSlotsAPI } from "@/lib/server-apis/booking/fetchAvailableTimeSlot-api";
import { createBooking } from "@/lib/server-apis/booking/createBooking-api";

interface BookingModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly turfId: string;
}

export default function BookingModal({
  isOpen,
  onClose,
  turfId,
}: BookingModalProps) {
  const router = useRouter();
  const { toast } = useToast();
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

  // Fetch time slots when date changes
  useEffect(() => {
    if (isOpen && turfId && selectedDate) {
      fetchAvailableTimeSlots();
    }
  }, [isOpen, turfId, selectedDate]);

  // Calculate totals when selected slots change
  useEffect(() => {
    if (selectedSlots.length > 0) {
      const total = selectedSlots.reduce((sum, slot) => {
        // Use price_override if available, otherwise use a default price
        const slotPrice = slot.price_override || 0;
        return sum + slotPrice;
      }, 0);

      setTotalAmount(total);
      // Calculate 65% for advance payment
      setAdvanceAmount(Math.round(total * 0.65 * 100) / 100);
    } else {
      setTotalAmount(0);
      setAdvanceAmount(0);
    }
  }, [selectedSlots]);

  const fetchAvailableTimeSlots = async () => {
    setIsLoading(true);
    try {
      const response = await fetchAvailableTimeSlotsAPI(turfId, selectedDate);

      if (response.success) {
        setTimeSlots(response.data);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to fetch time slots",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching available time slots:", error);
      toast({
        title: "Error",
        description: "Failed to fetch available time slots",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
    setSelectedSlots(prev => {
      // Check if slot is already selected
      const isSelected = prev.some(s => s._id === slot._id);
      
      if (isSelected) {
        // Remove from selection
        return prev.filter(s => s._id !== slot._id);
      } else {
        // Add to selection
        return [...prev, slot];
      }
    });
  };

  const handleContinue = () => {
    if (selectedSlots.length === 0) {
      toast({
        title: "No time slots selected",
        description: "Please select at least one time slot to continue",
        variant: "destructive",
      });
      return;
    }
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = async () => {
    if (!transactionId.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide a transaction ID for your payment",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const bookingData = {
        turfId,
        timeSlotIds: selectedSlots.map(slot => slot._id),
        advancePaymentTransactionId: transactionId.trim()
      };

      const result = await createBooking(bookingData);

      if (result.success) {
        toast({
          title: "Booking successful!",
          description: "Your booking has been confirmed",
        });
        
        // Reset form and close modal
        resetForm();
        onClose();
        
        // Redirect to bookings page or refresh
        router.refresh();
        router.push("/dashboard/bookings");
      } else {
        toast({
          title: "Booking failed",
          description: result.message || "Failed to create booking",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create booking",
        variant: "destructive",
      });
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
        {format(new Date(slot.start_time), "h:mm a")} - {format(new Date(slot.end_time), "h:mm a")}
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
                  <span className="font-medium">${totalAmount.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-primary">
                  <span className="font-medium">Advance Payment (65%):</span>
                  <span className="font-medium">${advanceAmount.toFixed(2)}</span>
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
                value={`$${totalAmount.toFixed(2)}`} 
                disabled 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="advanceAmount">Advance Payment (65%)</Label>
              <Input 
                id="advanceAmount" 
                value={`$${advanceAmount.toFixed(2)}`} 
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
                Please complete the advance payment of ${advanceAmount.toFixed(2)} via bKash/Nagad and enter the Transaction ID here.
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
                        {format(new Date(slot.start_time), "h:mm a")} - {format(new Date(slot.end_time), "h:mm a")}
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
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
              >
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
