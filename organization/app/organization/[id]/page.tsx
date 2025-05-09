'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import {
  FiCalendar,
  FiDollarSign,
  FiGrid,
  FiClock,
  FiUsers,
  FiArrowRight,
  FiBarChart2,
  FiBriefcase,
  FiMapPin
} from 'react-icons/fi';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { fetchOrganization } from '@/lib/server-apis/organization-details';
import { fetchTurfsByOrganization } from '@/lib/server-apis/view-turfs/fetchTurfsbyOrganization-api';
import { fetchTurfBookings } from '@/lib/server-apis/bookings/fetchTurfBookings';
import { fetchTurfCurrentMonthEarnings } from '@/lib/server-apis/bookings/fetchTurfCurrentMonthEarnings';
import { fetchTurfMonthlyEarnings } from '@/lib/server-apis/bookings/fetchTurfMonthlyEarnings';
import { IOrganization } from '@/types/organization';
import { ITurf } from '@/types/turf';
import { IBooking } from '@/types/bookingPageTypes';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function OrganizationDashboard() {
  const { id } = useParams();
  const [organization, setOrganization] = useState<IOrganization | null>(null);
  const [turfs, setTurfs] = useState<ITurf[]>([]);
  const [recentBookings, setRecentBookings] = useState<IBooking[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<{ month: string; revenue: number }[]>([]);
  const [currentMonthEarnings, setCurrentMonthEarnings] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingStats, setBookingStats] = useState({
    pending: 0,
    confirmed: 0,
    completed: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!id) return;

      try {
        setLoading(true);

        // Fetch organization details
        const orgData = await fetchOrganization(id as string);
        setOrganization(orgData);

        // Fetch turfs for this organization
        const turfsData = await fetchTurfsByOrganization(id as string);
        setTurfs(turfsData);

        if (turfsData.length > 0) {
          // Fetch recent bookings from the first turf
          // In a real application, you might want to aggregate bookings from all turfs
          const firstTurf = turfsData[0];
          const bookingsResponse = await fetchTurfBookings(
            firstTurf._id,
            id as string,
            { sortBy: 'createdAt', sortOrder: 'desc' },
            { page: 1, limit: 5 }
          );

          setRecentBookings(bookingsResponse.data);

          // Calculate booking statistics
          const allBookings = bookingsResponse.data;
          const stats = {
            pending: allBookings.filter(b => b.status === 'created' || b.status === 'advance_payment_completed').length,
            confirmed: allBookings.filter(b => b.status === 'completed').length,
            completed: allBookings.filter(b => b.status === 'completed').length
          };
          setBookingStats(stats);

          // Fetch revenue data - we'll aggregate earnings from all turfs
          let totalCurrentMonthEarnings = 0;
          const monthlyData: { [month: number]: number } = {};

          // Initialize all months with 0
          for (let i = 1; i <= 12; i++) {
            monthlyData[i] = 0;
          }

          // Fetch earnings data for each turf and aggregate
          await Promise.all(turfsData.map(async (turf) => {
            try {
              // Get current month earnings
              const currentEarnings = await fetchTurfCurrentMonthEarnings(turf._id, id as string);
              totalCurrentMonthEarnings += currentEarnings.data.earnings;

              // Get monthly earnings for the year
              const monthlyEarnings = await fetchTurfMonthlyEarnings(turf._id, id as string);

              // Add to monthly data
              monthlyEarnings.data.forEach(item => {
                monthlyData[item.month] += item.earnings;
              });
            } catch (error) {
              console.error(`Error fetching revenue for turf ${turf._id}:`, error);
            }
          }));

          // Format monthly data for chart
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const formattedMonthlyData = Object.entries(monthlyData).map(([month, revenue]) => ({
            month: monthNames[parseInt(month) - 1],
            revenue: revenue
          }));

          setMonthlyRevenue(formattedMonthlyData);
          setCurrentMonthEarnings(totalCurrentMonthEarnings);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setError('Failed to load organization dashboard data');
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [id]);

  // Chart configuration
  const revenueChartData = {
    labels: monthlyRevenue.map(item => item.month),
    datasets: [
      {
        label: 'Monthly Revenue (৳)',
        data: monthlyRevenue.map(item => item.revenue),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Monthly Revenue Distribution',
      },
    },
  };

  const calculateTotalRevenue = () => {
    return monthlyRevenue.reduce((total, item) => total + item.revenue, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-gray-600">
        <p className="text-lg mb-4">Failed to load organization data</p>
        <Link
          href="/organization"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Organizations
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 py-8"
    >
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome to {organization.name}</h1>
        <div className="flex items-center mt-2 text-gray-600">
          <FiMapPin className="mr-2" />
          <span>
            {organization.location?.address}, {organization.location?.city}
            {organization.location?.post_code && `, ${organization.location.post_code}`}
          </span>
        </div>
        <p className="text-gray-600 mt-2">Here's an overview of your organization's performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Turfs"
          value={turfs.length}
          icon={<FiGrid className="text-blue-600" />}
          href={`/organization/${id}/view-turfs`}
          bgColor="bg-blue-50"
          textColor="text-blue-800"
        />
        <StatsCard
          title="Current Month Revenue"
          value={`৳${currentMonthEarnings.toLocaleString()}`}
          icon={<FiDollarSign className="text-purple-600" />}
          href={`/organization/${id}/bookings`}
          bgColor="bg-purple-50"
          textColor="text-purple-800"
        />
        <StatsCard
          title="Active Bookings"
          value={bookingStats.pending}
          icon={<FiClock className="text-amber-600" />}
          href={`/organization/${id}/bookings`}
          bgColor="bg-amber-50"
          textColor="text-amber-800"
        />
        <StatsCard
          title="Completed Bookings"
          value={bookingStats.completed}
          icon={<FiCalendar className="text-green-600" />}
          href={`/organization/${id}/bookings`}
          bgColor="bg-green-50"
          textColor="text-green-800"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart - Left side */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-md p-6 h-full">
            <h2 className="text-xl font-semibold mb-6 text-gray-800">Revenue Overview</h2>
            <div className="h-80">
              {monthlyRevenue.length > 0 && calculateTotalRevenue() > 0 ? (
                <Bar data={revenueChartData} options={chartOptions} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <FiDollarSign className="text-4xl mb-4 text-gray-300" />
                  <p>No revenue data available yet</p>
                  <p className="text-sm mt-2">Complete bookings to see revenue statistics</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions - Right side */}
        <div>
          <div className="bg-white rounded-xl shadow-md p-6 h-full">
            <h2 className="text-xl font-semibold mb-6 text-gray-800">Quick Actions</h2>
            <div className="space-y-4">
              <QuickAction
                icon={<FiGrid />}
                title="Manage Turfs"
                description={`${turfs.length > 0 ? 'Edit your turfs' : 'Create your first turf'}`}
                href={`/organization/${id}/view-turfs`}
                bgColor="bg-blue-500"
              />
              <QuickAction
                icon={<FiCalendar />}
                title="Manage Bookings"
                description="View and manage all your turf bookings"
                href={`/organization/${id}/bookings`}
                bgColor="bg-green-500"
              />
              <QuickAction
                icon={<FiBriefcase />}
                title="Organization Profile"
                description="Update your organization details"
                href={`/organization/${id}/view-organization`}
                bgColor="bg-purple-500"
              />
              <QuickAction
                icon={<FiUsers />}
                title="Manage Users"
                description="Add or remove users from your organization"
                href={`/organization/${id}/users`}
                bgColor="bg-amber-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Recent Bookings</h2>
          <Link
            href={`/organization/${id}/bookings`}
            className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium"
          >
            View all <FiArrowRight className="ml-1" />
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {recentBookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Turf
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentBookings.map((booking) => {
                    const user = booking.userId as any;
                    const userName = user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'Unknown User';
                    const turfId = booking.turf as any;
                    const matchingTurf = turfs.find(turf => turf._id === turfId)
                    const turfName = matchingTurf?.name || 'Unknown Turf';
                    const timeSlots = booking.timeSlots as any[];
                    const firstTimeSlot = timeSlots && timeSlots.length > 0 ? timeSlots[0] : null;

                    return (
                      <tr key={booking._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {turfName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {userName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {firstTimeSlot ? (
                            <div>
                              <div>{format(new Date(firstTimeSlot.start_time), 'dd MMM yyyy')}</div>
                              <div className="text-xs text-gray-500">
                                {format(new Date(firstTimeSlot.start_time), 'h:mm a')} -
                                {format(new Date(firstTimeSlot.end_time), 'h:mm a')}
                              </div>
                            </div>
                          ) : (
                            'Not scheduled'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>৳{booking.isPaid ? booking.advanceAmount.toLocaleString() : booking.totalAmount.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">
                            {booking.isPaid ? 'Fully Paid' : `Remaining: ৳${booking.finalAmount.toLocaleString()}`}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <BookingStatusBadge status={booking.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500">
              <FiCalendar className="mx-auto text-4xl mb-4 text-gray-300" />
              <p>No bookings found</p>
              <p className="text-sm mt-2">Bookings will appear here once customers make reservations</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Helper Components
interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  href: string;
  bgColor: string;
  textColor: string;
}

const StatsCard = ({ title, value, icon, href, bgColor, textColor }: StatsCardProps) => (
  <Link href={href}>
    <motion.div
      whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
      className={`rounded-xl shadow-md p-6 flex flex-col transition-all cursor-pointer ${bgColor} border border-gray-100`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-medium ${textColor}`}>{title}</h3>
        <div className="p-2 bg-white bg-opacity-80 rounded-full shadow-sm">
          {icon}
        </div>
      </div>
      <div className={`text-3xl font-bold ${textColor}`}>{value}</div>
    </motion.div>
  </Link>
);

interface QuickActionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  bgColor: string;
}

const QuickAction = ({ icon, title, description, href, bgColor }: QuickActionProps) => (
  <Link href={href}>
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="flex items-start p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className={`p-3 rounded-lg text-white ${bgColor} mr-4`}>
        {icon}
      </div>
      <div>
        <h3 className="font-medium text-gray-800">{title}</h3>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
    </motion.div>
  </Link>
);

const BookingStatusBadge = ({ status }: { status: string }) => {
  let bgColor = '';
  let textColor = '';

  switch (status) {
    case 'confirmed':
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
      break;
    case 'advance_payment_completed':
      bgColor = 'bg-yellow-100';
      textColor = 'text-yellow-800';
      break;
    case 'pending':
      bgColor = 'bg-yellow-100';
      textColor = 'text-yellow-800';
      break;
    case 'completed':
      bgColor = 'bg-blue-100';
      textColor = 'text-blue-800';
      break;
    case 'cancelled':
    case 'canceled':
      bgColor = 'bg-red-100';
      textColor = 'text-red-800';
      break;
    default:
      bgColor = 'bg-gray-100';
      textColor = 'text-gray-800';
  }

  // Format status for display
  let displayStatus = status.replace('_', ' ');
  displayStatus = displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1);

  return (
    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor} ${textColor}`}>
      {displayStatus}
    </span>
  );
};