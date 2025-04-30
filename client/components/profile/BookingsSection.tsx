"use client";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { getUserBookings } from "@/lib/server-apis/booking/getUserBookings-api";
import { completeStripeBooking } from "@/lib/server-apis/booking/completeStripeBooking-api";
import { IBooking } from "@/types/booking";
import { ITimeSlot } from "@/types/timeslot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "react-hot-toast";
import {
  Loader2,
  Calendar,
  CheckCircle,
  AlertCircle,
  Building,
} from "lucide-react";

export default function BookingsSection() {
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // State for payment completion modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<IBooking | null>(null);
  const [transactionId, setTransactionId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch bookings on initial load and when page changes
  useEffect(() => {
    fetchBookings();
  }, [currentPage]);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const response = await getUserBookings({
        page: currentPage,
        limit: 5,
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      setBookings(response.data);
      setTotalPages(response.meta.pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bookings");
      toast.error("Failed to load bookings");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const openPaymentModal = (booking: IBooking) => {
    setSelectedBooking(booking);
    setTransactionId("");
    setIsPaymentModalOpen(true);
  };

  const handleCompletePayment = async () => {
    if (!selectedBooking) return;

    if (!transactionId.trim()) {
      toast.error("Please enter the transaction ID");
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await completeStripeBooking(
        selectedBooking._id,
        transactionId.trim()
      );

      toast.success("Payment completed successfully!");
      setIsPaymentModalOpen(false);

      // Update the booking in the list
      setBookings((prevBookings) =>
        prevBookings.map((booking) =>
          booking._id === result.data._id ? result.data : booking
        )
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to complete payment"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "created":
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-gray-200 text-gray-800">
            Created
          </span>
        );
      case "advance_payment_completed":
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-yellow-200 text-yellow-800">
            Advance Paid
          </span>
        );
      case "completed":
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-green-200 text-green-800">
            Completed
          </span>
        );
      case "rejected":
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-red-200 text-red-800">
            Rejected
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-gray-200 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const formatTimeSlots = (timeSlots: ITimeSlot[]) => {
    if (!timeSlots || timeSlots.length === 0) return "No time slots";

    return timeSlots.map((slot) => {
      try {
        // Check if slot and its required properties exist
        if (!slot || !slot.start_time || !slot.end_time) {
          return <div key={slot?._id || Math.random()} className="text-sm">Invalid time slot data</div>;
        }
        
        // Parse dates safely
        const startTime = new Date(slot.start_time);
        const endTime = new Date(slot.end_time);
        
        // Validate dates are valid before formatting
        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
          return <div key={slot._id} className="text-sm">Invalid date format</div>;
        }
        
        return (
          <div key={slot._id} className="text-sm">
            {format(startTime, "dd MMM yy, h:mm a")} - {format(endTime, "h:mm a")}
          </div>
        );
      } catch (error) {
        console.error("Error formatting time slot:", error, slot);
        return <div key={slot?._id || Math.random()} className="text-sm">Error displaying time slot</div>;
      }
    });
  };

  if (error) {
    return (
      <div className="bg-white rounded-xl p-8 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-2 text-lg font-semibold text-gray-900">
          Error loading bookings
        </h3>
        <p className="mt-1 text-gray-500">{error}</p>
        <Button
          onClick={() => fetchBookings()}
          className="mt-4"
          variant="outline"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center">
        <Calendar className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-semibold text-gray-900">
          No bookings found
        </h3>
        <p className="mt-1 text-gray-500">You have not made any bookings yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Your Bookings</h2>

      <div className="space-y-4">
        {bookings.map((booking) => (
          <div
            key={booking._id}
            className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="border-b bg-gray-50 px-4 py-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-gray-500" />
                <span className="font-medium">
                  {typeof booking.turf === "string"
                    ? "Turf"
                    : booking.turf.name}
                </span>
              </div>
              <div>{getStatusBadge(booking.status)}</div>
            </div>

            <div className="p-4 grid sm:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">
                  Time Slots
                </h4>
                <div className="mt-1 space-y-1">
                  {formatTimeSlots(booking.timeSlots as ITimeSlot[])}
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    Booking ID
                  </h4>
                  <p className="text-sm text-gray-800">
                    {booking._id.substring(0, 10)}...
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    Payment Details
                  </h4>
                  <div className="grid grid-cols-2 gap-1 text-sm">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-medium">
                      ৳{booking.totalAmount.toFixed(2)}
                    </span>

                    <span className="text-gray-600">Advance Paid:</span>
                    <span>৳{booking.advanceAmount.toFixed(2)}</span>

                    <span className="text-gray-600">Remaining:</span>
                    <span>৳{booking.finalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="pt-2">
                  {booking.status === "advance_payment_completed" && (
                    <Button
                      onClick={() => openPaymentModal(booking)}
                      className="w-full"
                      size="sm"
                    >
                      Complete Payment
                    </Button>
                  )}

                  {booking.status === "completed" && (
                    <div className="flex items-center text-green-600 text-sm">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Payment completed
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-3 py-1">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Payment Completion Modal */}
      <Dialog
        open={isPaymentModalOpen}
        onOpenChange={(open) => setIsPaymentModalOpen(open)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Complete Your Payment</DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="totalAmount">Total Amount</Label>
              <Input
                id="totalAmount"
                value={`৳${selectedBooking?.totalAmount.toFixed(2) || "0.00"}`}
                readOnly
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="advanceAmount">Advance Paid</Label>
              <Input
                id="advanceAmount"
                value={`৳${
                  selectedBooking?.advanceAmount.toFixed(2) || "0.00"
                }`}
                readOnly
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="finalAmount">Remaining Amount</Label>
              <Input
                id="finalAmount"
                value={`৳${selectedBooking?.finalAmount.toFixed(2) || "0.00"}`}
                className="font-medium"
                readOnly
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transactionId">
                Stripe Transaction ID <span className="text-red-500">*</span>
              </Label>
              <Input
                id="transactionId"
                placeholder="Enter your Stripe transaction ID"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Please provide the transaction ID from your Stripe payment for
                verification.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPaymentModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleCompletePayment} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing
                </>
              ) : (
                "Complete Payment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
