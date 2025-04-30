// // app/organization/[id]/page.tsx

// "use client";
// import { useEffect, useState } from 'react';
// import { useParams } from 'next/navigation';
// import { motion } from 'framer-motion';
// import { FiBarChart2, FiUsers, FiCalendar, FiClock, FiTrendingUp } from 'react-icons/fi';

// interface DashboardCard {
//   title: string;
//   value: string | number;
//   change: number;
//   icon: React.ReactNode;
//   color: string;
// }

// const OrganizationDashboard = () => {
//   const params = useParams();
//   const orgId = params.id as string;
//   const [orgName, setOrgName] = useState("Your Organization");
//   const [isLoading, setIsLoading] = useState(true);

//   // Simulated data - replace with actual API calls
//   const dashboardCards: DashboardCard[] = [
//     {
//       title: "Total Bookings",
//       value: 248,
//       change: 12.5,
//       icon: <FiCalendar size={24} />,
//       color: "blue"
//     },
//     {
//       title: "Active Members",
//       value: 1423,
//       change: 5.2,
//       icon: <FiUsers size={24} />,
//       color: "green"
//     },
//     {
//       title: "Utilization Rate",
//       value: "78%",
//       change: 3.1,
//       icon: <FiBarChart2 size={24} />,
//       color: "purple"
//     },
//     {
//       title: "Avg. Session Time",
//       value: "1h 45m",
//       change: -2.3,
//       icon: <FiClock size={24} />,
//       color: "orange"
//     }
//   ];

//   // Simulated API call to get organization data
//   useEffect(() => {
//     const fetchOrgData = async () => {
//       // Replace with your actual API call
//       try {
//         // Simulated API response delay
//         setTimeout(() => {
//           setOrgName("Riverside Sports Complex");
//           setIsLoading(false);
//         }, 1000);
//       } catch (error) {
//         console.error("Error fetching organization data:", error);
//         setIsLoading(false);
//       }
//     };

//     fetchOrgData();
//   }, [orgId]);

//   // Simulated chart data
//   const chartData = {
//     labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
//     values: [65, 78, 52, 91, 83, 125, 118]
//   };

//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center h-screen -mt-16">
//         <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
//       </div>
//     );
//   }

//   return (
//     <div className="animate-fadeIn">
//       {/* Page Header */}
//       <div className="mb-8">
//         <motion.h1 
//           initial={{ opacity: 0, y: -10 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.5 }}
//           className="text-3xl font-bold text-gray-800"
//         >
//           {orgName}
//         </motion.h1>
//         <p className="text-gray-500 mt-1">Dashboard overview and key metrics</p>
//       </div>

//       {/* Stats Cards */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//         {dashboardCards.map((card, index) => (
//           <motion.div
//             key={card.title}
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.5, delay: index * 0.1 }}
//             className="bg-white rounded-2xl shadow-md p-6"
//           >
//             <div className="flex items-start justify-between">
//               <div>
//                 <h3 className="text-gray-500 text-sm font-medium mb-1">{card.title}</h3>
//                 <div className="flex items-baseline">
//                   <p className="text-2xl font-bold text-gray-800">{card.value}</p>
//                   <span className={`ml-2 text-xs font-medium ${card.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
//                     {card.change >= 0 ? '+' : ''}{card.change}%
//                   </span>
//                 </div>
//               </div>
//               <div className={`h-12 w-12 rounded-xl flex items-center justify-center bg-${card.color}-100`}>
//                 <div className={`text-${card.color}-600`}>{card.icon}</div>
//               </div>
//             </div>
//           </motion.div>
//         ))}
//       </div>

//       {/* Main Content */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//         {/* Chart Section */}
//         <motion.div 
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.5, delay: 0.4 }}
//           className="lg:col-span-2 bg-white rounded-2xl shadow-md p-6"
//         >
//           <div className="flex items-center justify-between mb-6">
//             <h2 className="text-lg font-semibold text-gray-800">Weekly Bookings</h2>
//             <div className="flex items-center text-sm text-green-600 font-medium">
//               <FiTrendingUp className="mr-1" /> +8.2% vs last week
//             </div>
//           </div>
          
//           {/* Placeholder for actual chart - replace with your preferred chart library */}
//           <div className="h-64 w-full">
//             <div className="bg-gray-50 rounded-xl h-full w-full flex items-center justify-center">
//               <div className="space-y-1">
//                 <div className="flex items-center space-x-2">
//                   {chartData.labels.map((day, i) => (
//                     <div key={day} className="flex flex-col items-center">
//                       <div 
//                         className="bg-blue-500 rounded-t-md w-8" 
//                         style={{ height: `${chartData.values[i] / 1.5}px` }}
//                       ></div>
//                       <span className="text-xs text-gray-500 mt-1">{day}</span>
//                     </div>
//                   ))}
//                 </div>
//                 <p className="text-xs text-center text-gray-400">
//                   Replace with your actual chart component
//                 </p>
//               </div>
//             </div>
//           </div>
//         </motion.div>

//         {/* Recent Activity */}
//         <motion.div 
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.5, delay: 0.5 }}
//           className="bg-white rounded-2xl shadow-md p-6"
//         >
//           <h2 className="text-lg font-semibold text-gray-800 mb-6">Recent Activity</h2>
//           <div className="space-y-4">
//             {[
//               { action: "New booking", user: "John D.", time: "10 min ago" },
//               { action: "Payment received", user: "Sarah M.", time: "1 hour ago" },
//               { action: "Membership renewed", user: "Robert L.", time: "3 hours ago" },
//               { action: "Facility maintenance", user: "System", time: "Yesterday" },
//             ].map((activity, index) => (
//               <div key={index} className="flex items-start">
//                 <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
//                   <span className="font-semibold text-blue-700 text-xs">
//                     {activity.user.charAt(0)}
//                   </span>
//                 </div>
//                 <div className="ml-3">
//                   <p className="text-sm text-gray-800">
//                     <span className="font-medium">{activity.action}</span> - {activity.user}
//                   </p>
//                   <p className="text-xs text-gray-500">{activity.time}</p>
//                 </div>
//               </div>
//             ))}
//           </div>
//           <button className="w-full mt-6 text-sm text-blue-600 font-medium hover:underline">
//             View all activity
//           </button>
//         </motion.div>
//       </div>

//       <style jsx>{`
//         @keyframes fadeIn {
//           from { opacity: 0; }
//           to { opacity: 1; }
//         }
//         .animate-fadeIn {
//           animation: fadeIn 0.5s ease-out;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default OrganizationDashboard;


export default function OrganizationDashboard() {
  return <>
  </>
}