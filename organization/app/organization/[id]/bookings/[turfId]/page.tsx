'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  FiArrowLeft,
  FiDollarSign,
  FiCalendar,
  FiClock,
  FiUser,
  FiCheck,
  FiX,
  FiArrowRight,
  FiArrowUp,
  FiArrowDown,
  FiFilter,
} from 'react-icons/fi';
import Link from 'next/link';
import {
  fetchTurfBookings,
  fetchTurfMonthlyEarnings,
  fetchTurfCurrentMonthEarnings,
  completeCashBooking,
} from '@/lib/server-apis/bookings/index';
import { fetchTurfById } from '@/lib/server-apis/view-turfs/fetchTurfbyId-api';
import { ITurf } from '@/types/turf';
import {IBooking} from '@/types/bookingPageTypes';
import { BookingFilters } from '@/types/bookingPageTypes';
import {BookingStatus} from '@/types/bookingPageTypes';



// For chart
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Status badge component
const StatusBadge = ({ status }: { status: BookingStatus }) => {
  switch (status) {
    case 'created':
      return (
        <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
          Created
        </span>
      );
    case 'advance_payment_completed':
      return (
        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
          Advance Paid
        </span>
      );
    case 'completed':
      return (
        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">
          Completed
        </span>
      );
    case 'rejected':
      return (
        <span className="px-3 py-1 bg-red-100 text-red-800 text-xs rounded-full">
          Rejected
        </span>
      );
    default:
      return (
        <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
          {status}
        </span>
      );
  }
};

// Dialog component for confirmation
const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
      >
        <h2 className="text-xl font-semibold mb-2">{title}</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Confirm
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// Filter component
const BookingFilter = ({
  filters,
  setFilters,
  onFilterApply,
}: {
  filters: BookingFilters;
  setFilters: React.Dispatch<React.SetStateAction<BookingFilters>>;
  onFilterApply: () => void;
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <select
          id="status"
          className="w-full border border-gray-300 rounded-md p-2 text-sm"
          value={filters.status as string || ''}
          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as BookingStatus || undefined }))}
        >
          <option value="">All Statuses</option>
          <option value="created">Created</option>
          <option value="advance_payment_completed">Advance Paid</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      <div>
        <label htmlFor="fromDate" className="block text-sm font-medium text-gray-700 mb-1">
          From Date
        </label>
        <input
          type="date"
          id="fromDate"
          className="w-full border border-gray-300 rounded-md p-2 text-sm"
          value={filters.fromDate || ''}
          onChange={(e) => setFilters(prev => ({ ...prev, fromDate: e.target.value || undefined }))}
        />
      </div>
      <div>
        <label htmlFor="toDate" className="block text-sm font-medium text-gray-700 mb-1">
          To Date
        </label>
        <input
          type="date"
          id="toDate"
          className="w-full border border-gray-300 rounded-md p-2 text-sm"
          value={filters.toDate || ''}
          onChange={(e) => setFilters(prev => ({ ...prev, toDate: e.target.value || undefined }))}
        />
      </div>
      <div className="flex items-end">
        <button
          onClick={onFilterApply}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md flex items-center justify-center gap-2 hover:bg-blue-700"
        >
          <FiFilter size={16} />
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default function TurfBookingsPage() {
  const params = useParams();
  const router = useRouter();
  const { id: organizationId, turfId } = params;

  // State management
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [turf, setTurf] = useState<ITurf | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompletingBooking, setIsCompletingBooking] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<IBooking | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [monthlyEarnings, setMonthlyEarnings] = useState<{ month: number; earnings: number }[]>([]);
  const [currentMonthEarnings, setCurrentMonthEarnings] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'bookings' | 'earnings'>('bookings');
  const [filters, setFilters] = useState<BookingFilters>({
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // Fetch turf details
  useEffect(() => {
    async function loadTurf() {
      if (!turfId) return;
      
      try {
        const turfData = await fetchTurfById(turfId as string);
        setTurf(turfData);
      } catch (error) {
        console.error('Error loading turf:', error);
        toast.error('Failed to load turf details');
      }
    }
    
    loadTurf();
  }, [turfId]);

  // Fetch bookings
  useEffect(() => {
    async function loadBookings() {
      if (!turfId || !organizationId) return;
      
      setIsLoading(true);
      try {
        const response = await fetchTurfBookings(
          turfId as string,
          organizationId as string, // Add organizationId parameter
          filters,
          { page: currentPage, limit: 10 }
        );
        
        setBookings(response.data);
        setTotalPages(response.meta.pages);
      } catch (error) {
        console.error('Error loading bookings:', error);
        toast.error('Failed to load bookings');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadBookings();
  }, [turfId, organizationId, currentPage, filters]);

  // Fetch earnings data when tab changes to earnings
  useEffect(() => {
    async function loadEarningsData() {
      if (activeTab !== 'earnings' || !turfId || !organizationId) return;
      
      try {
        const [monthlyData, currentMonthData] = await Promise.all([
          fetchTurfMonthlyEarnings(
            turfId as string,
            organizationId as string // Add organizationId parameter
          ),
          fetchTurfCurrentMonthEarnings(
            turfId as string,
            organizationId as string // Add organizationId parameter
          )
        ]);
        
        setMonthlyEarnings(monthlyData.data);
        setCurrentMonthEarnings(currentMonthData.data.earnings);
      } catch (error) {
        console.error('Error loading earnings data:', error);
        toast.error('Failed to load earnings data');
      }
    }
    
    loadEarningsData();
  }, [activeTab, turfId, organizationId]);

  const handleCompleteBooking = async (booking: IBooking) => {
    setSelectedBooking(booking);
    setIsConfirmDialogOpen(true);
  };

  const confirmCompleteBooking = async () => {
    if (!selectedBooking || !organizationId) return;
    
    setIsCompletingBooking(true);
    try {
      // Pass organizationId to the API function
      await completeCashBooking(
        selectedBooking._id,
        organizationId as string // Add organizationId parameter
      );
      toast.success('Booking completed successfully');
      
      // Update booking status in the list
      setBookings(prevBookings => 
        prevBookings.map(b => 
          b._id === selectedBooking._id 
            ? { ...b, status: 'completed', isPaid: true, finalPaymentMethod: 'cash' } 
            : b
        )
      );
    } catch (error) {
      console.error('Error completing booking:', error);
      toast.error('Failed to complete booking');
    } finally {
      setIsCompletingBooking(false);
      setIsConfirmDialogOpen(false);
      setSelectedBooking(null);
    }
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
  };

  const handleSortChange = (sortBy: 'createdAt' | 'updatedAt' | 'totalAmount') => {
    setFilters(prev => {
      // If already sorting by this field, toggle direction
      if (prev.sortBy === sortBy) {
        return {
          ...prev,
          sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc'
        };
      }
      // Otherwise, sort by the new field in descending order
      return {
        ...prev,
        sortBy,
        sortOrder: 'desc'
      };
    });
  };

  // Prepare chart data
  const chartData = {
    labels: [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ],
    datasets: [
      {
        label: 'Monthly Earnings (৳)',
        data: monthlyEarnings.map(month => month.earnings),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Monthly Earnings Distribution',
      },
    },
  };

  // Render loading state
  if (isLoading && !bookings.length) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb navigation */}
      <div className="flex items-center text-sm text-gray-500 mb-6">
        <Link
          href={`/organization/${organizationId}`}
          className="hover:text-blue-600 transition-colors"
        >
          Dashboard
        </Link>
        <span className="mx-2">/</span>
        <Link
          href={`/organization/${organizationId}/view-turfs`}
          className="hover:text-blue-600 transition-colors"
        >
          Turfs
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">
          {turf?.name || 'Turf'} Bookings
        </span>
      </div>

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/organization/${organizationId}/view-turfs/${turfId}`}
              className="text-blue-600 hover:text-blue-700 transition-colors"
            >
              <FiArrowLeft className="inline mr-1" /> Back to Turf
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            {turf?.name || 'Turf'} Management
          </h1>
        </div>

        {/* Current Month Earnings Card */}
        {activeTab === 'earnings' && (
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <FiDollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Current Month Earnings</h3>
                <p className="text-2xl font-bold">৳{currentMonthEarnings.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-gray-100 rounded-lg p-1 flex mb-6">
        <button
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
            activeTab === 'bookings'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-700 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('bookings')}
        >
          <FiCalendar className="inline mr-2" /> Bookings
        </button>
        <button
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
            activeTab === 'earnings'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-700 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('earnings')}
        >
          <FiDollarSign className="inline mr-2" /> Earnings
        </button>
      </div>

      {/* Bookings Tab Content */}
      {activeTab === 'bookings' && (
        <>
          <BookingFilter
            filters={filters}
            setFilters={setFilters}
            onFilterApply={handleApplyFilters}
          />

          {bookings.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center shadow-sm border border-gray-100">
              <FiCalendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No bookings found</h3>
              <p className="text-gray-500">There are no bookings matching your criteria.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSortChange('createdAt')}
                    >
                      <div className="flex items-center">
                        Date
                        {filters.sortBy === 'createdAt' && (
                          filters.sortOrder === 'asc' ? 
                            <FiArrowUp className="ml-1" /> : 
                            <FiArrowDown className="ml-1" />
                        )}
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time Slots
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSortChange('totalAmount')}
                    >
                      <div className="flex items-center">
                        Amount
                        {filters.sortBy === 'totalAmount' && (
                          filters.sortOrder === 'asc' ? 
                            <FiArrowUp className="ml-1" /> : 
                            <FiArrowDown className="ml-1" />
                        )}
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookings.map((booking) => {
                    const user = booking.userId as any;
                    const userName = user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'Unknown User';
                    const timeSlots = booking.timeSlots as any[];
                    
                    return (
                      <tr key={booking._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                              <FiUser />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{userName}</div>
                              <div className="text-xs text-gray-500">{user?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {format(new Date(booking.createdAt), 'dd MMM yyyy')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {format(new Date(booking.createdAt), 'h:mm a')}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500 max-h-20 overflow-y-auto">
                            {timeSlots && timeSlots.length > 0 ? (
                              timeSlots.map((slot, index) => (
                                <div key={index} className="text-xs mb-1 flex items-center">
                                  <FiClock className="mr-1" size={12} />
                                  {format(new Date(slot.start_time), 'dd MMM, h:mm a')} - {format(new Date(slot.end_time), 'h:mm a')}
                                </div>
                              ))
                            ) : (
                              <span className="text-gray-400">No time slots</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {booking.status === 'completed' ? (
                            <div className="text-sm font-medium text-gray-900">৳{booking.totalAmount.toFixed(2)}</div>
                          ) : (
                            <div className="text-sm font-medium text-gray-900">৳{booking.advanceAmount.toFixed(2)}</div>
                          )}
                          <div className="text-xs text-gray-500">
                            {booking.status === 'completed' 
                              ? `Full payment received`
                              : `Advance: ${((booking.advanceAmount / booking.totalAmount) * 100).toFixed(0)}% of ৳${booking.totalAmount.toFixed(2)}`
                            }
                          </div>
                          {booking.status === 'advance_payment_completed' && (
                            <div className="text-xs text-gray-500">
                              Pending: ৳{booking.finalAmount.toFixed(2)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={booking.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {booking.status === 'advance_payment_completed' && (
                            <button
                              onClick={() => handleCompleteBooking(booking)}
                              className="text-blue-600 hover:text-blue-900 mr-4"
                            >
                              <FiCheck className="inline mr-1" /> Complete Cash Payment
                            </button>
                          )}
                          {booking.status === 'completed' && (
                            <span className="text-green-600 flex items-center">
                              <FiCheck className="mr-1" /> 
                              Payment Complete
                              {booking.finalPaymentMethod && (
                                <span className="ml-1 text-xs text-gray-500">
                                  ({booking.finalPaymentMethod})
                                </span>
                              )}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <nav className="relative z-0 inline-flex shadow-sm rounded-md">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === 1
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === totalPages
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </>
      )}

      {/* Earnings Tab Content */}
      {activeTab === 'earnings' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold mb-6">Earnings Overview - {new Date().getFullYear()}</h2>
          <div className="h-80">
            <Bar data={chartData} options={chartOptions} />
          </div>

          {/* Monthly Earnings Table */}
          <div className="mt-8">
            <h3 className="text-lg font-medium mb-4">Monthly Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Month
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Earnings (৳)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {monthlyEarnings.map((month, index) => (
                    <tr key={index} className={month.earnings > 0 ? 'hover:bg-gray-50' : 'text-gray-400'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {chartData.labels[month.month - 1]}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">
                        {month.earnings.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold">
                      Total
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold">
                      {monthlyEarnings.reduce((sum, month) => sum + month.earnings, 0).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={confirmCompleteBooking}
        title="Complete Cash Payment"
        message="Are you sure you want to mark this booking as paid with cash? This action cannot be undone."
      />
    </div>
  );
}