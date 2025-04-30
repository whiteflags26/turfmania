// app/organization/[id]/layout.tsx

'use client';

import RouteGuard from '@/components/RouteGuard';
import { useAuth } from '@/lib/contexts/authContext';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { FaRegBuilding } from 'react-icons/fa';
import {
  FiBarChart2,
  FiChevronRight,
  FiDollarSign,
  FiHome,
  FiLogOut,
  FiMenu,
  FiMessageSquare,
  FiSettings,
  FiUsers,
} from 'react-icons/fi';

interface MenuItem {
  readonly name: string;
  readonly icon: ReactNode;
  readonly path: string;
}

export default function DashboardLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const params = useParams();
  const orgId = params.id as string;
  const { user, logout } = useAuth();

  // Check if mobile on mount and when window resizes
  useEffect(() => {
    const checkIfMobile = () => {
      setIsCollapsed(window.innerWidth < 1024);
    };

    // Initial check
    checkIfMobile();

    // Add event listener
    window.addEventListener('resize', checkIfMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const menuItems: MenuItem[] = [
    {
      name: 'Dashboard',
      icon: <FiHome className="h-5 w-5" />,
      path: `/organization/${orgId}`,
    },
    {
      name: 'View Organization',
      icon: <FaRegBuilding className="h-5 w-5" />,
      path: `/organization/${orgId}/view-organization`,
    },
    {
      name: 'View Turfs',
      icon: <FiUsers className="h-5 w-5" />,
      path: `/organization/${orgId}/view-turfs`,
    },
    {
      name: 'Timeslot Management',
      icon: <FiBarChart2 className="h-5 w-5" />,
      path: `/organization/${orgId}/turf-timeslot`,
    },
    {
      name: 'Payments',
      icon: <FiDollarSign className="h-5 w-5" />,
      path: `/organization/${orgId}/payments`,
    },
    {
      name: 'Messages',
      icon: <FiMessageSquare className="h-5 w-5" />,
      path: `/organization/${orgId}/messages`,
    },
    {
      name: 'Settings',
      icon: <FiSettings className="h-5 w-5" />,
      path: `/organization/${orgId}/settings`,
    },
  ];

  return (
    <RouteGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex">
        {/* Desktop Sidebar */}
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ width: isCollapsed ? 80 : 250 }}
            animate={{ width: isCollapsed ? 80 : 250 }}
            exit={{ width: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className={`bg-white shadow-xl hidden lg:block h-screen sticky top-0 z-30`}
          >
            <div className="flex flex-col h-full">
              {/* Logo Section */}
              <div className="p-4 flex items-center justify-between border-b border-gray-100">
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center"
                  >
                    <span className="font-bold text-xl text-blue-600">
                      TurfMania
                    </span>
                  </motion.div>
                )}
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <FiChevronRight
                    className={`h-5 w-5 text-gray-500 transform transition-transform ${
                      isCollapsed ? '' : 'rotate-180'
                    }`}
                  />
                </button>
              </div>

              {/* User Profile Section */}
              <div
                className={`border-b border-gray-100 py-4 px-3 ${
                  isCollapsed ? 'flex justify-center' : ''
                }`}
              >
                {!isCollapsed ? (
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="font-semibold text-blue-700">
                        {user?.email?.charAt(0).toUpperCase() ?? 'U'}
                      </span>
                    </div>
                    <div className="flex-grow overflow-hidden">
                      <p className="font-medium text-gray-800 truncate">
                        {user?.email ?? 'User'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        Organization Owner
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="font-semibold text-blue-700">
                      {user?.email?.charAt(0).toUpperCase() ?? 'U'}
                    </span>
                  </div>
                )}
              </div>

              {/* Navigation Menu */}
              <div className="flex-grow py-4 overflow-y-auto scrollbar-thin">
                <ul className="space-y-1 px-3">
                  {menuItems.map(item => {
                    const isActive = pathname === item.path;
                    return (
                      <li key={item.name}>
                        <Link href={item.path} passHref>
                          <button
                            type="button"
                            className={`flex items-center w-full text-left px-3 py-3 rounded-xl cursor-pointer transition-all ${
                              isActive
                                ? 'bg-blue-50 text-blue-600'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <div className="flex items-center justify-center">
                              {item.icon}
                            </div>
                            <span className="ml-3 font-medium">
                              {item.name}
                            </span>
                          </button>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Logout Section */}
              <div
                className={`p-4 border-t border-gray-100 ${
                  isCollapsed ? 'flex justify-center' : ''
                }`}
              >
                <button
                  onClick={() => logout()}
                  className={`flex items-center text-gray-600 hover:text-red-600 transition-colors ${
                    isCollapsed ? 'justify-center p-2' : 'px-3 py-2'
                  }`}
                >
                  <FiLogOut className="h-5 w-5" />
                  {!isCollapsed && <span className="ml-2">Logout</span>}
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white shadow-md">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100 mr-3"
              >
                <FiMenu className="h-6 w-6 text-gray-700" />
              </button>
              <span className="font-bold text-xl text-blue-600">TurfMania</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="font-semibold text-blue-700">
                {user?.email?.charAt(0).toUpperCase() ?? 'U'}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                onClick={() => setMobileMenuOpen(false)}
              />
              <motion.div
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed left-0 top-0 h-full w-64 bg-white shadow-xl z-50 lg:hidden"
              >
                <div className="flex flex-col h-full">
                  {/* Logo Section */}
                  <div className="p-4 flex items-center justify-between border-b border-gray-100">
                    <span className="font-bold text-xl text-blue-600">
                      TurfMania
                    </span>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2 rounded-lg hover:bg-gray-100"
                    >
                      <FiChevronRight className="h-5 w-5 text-gray-500" />
                    </button>
                  </div>

                  {/* User Profile Section */}
                  <div className="border-b border-gray-100 py-4 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="font-semibold text-blue-700">
                          {user?.email?.charAt(0).toUpperCase() ?? 'U'}
                        </span>
                      </div>
                      <div className="flex-grow overflow-hidden">
                        <p className="font-medium text-gray-800 truncate">
                          {user?.email ?? 'User'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Organization Owner
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Navigation Menu */}
                  <div className="flex-grow py-4 overflow-y-auto">
                    <ul className="space-y-1 px-3">
                      {menuItems.map(item => {
                        const isActive = pathname === item.path;
                        return (
                          <li key={item.name}>
                            <Link href={item.path} passHref>
                              <button
                                type="button"
                                className={`flex items-center w-full text-left px-3 py-3 rounded-xl cursor-pointer transition-all ${
                                  isActive
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                                onClick={() => setMobileMenuOpen(false)}
                              >
                                <div className="flex items-center justify-center">
                                  {item.icon}
                                </div>
                                <span className="ml-3 font-medium">
                                  {item.name}
                                </span>
                              </button>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {/* Logout Section */}
                  <div className="p-4 border-t border-gray-100">
                    <button
                      onClick={() => logout()}
                      className="flex items-center px-3 py-2 text-gray-600 hover:text-red-600 transition-colors"
                    >
                      <FiLogOut className="h-5 w-5" />
                      <span className="ml-2">Logout</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-grow lg:ml-0 pt-[72px] lg:pt-0">
          <div className="p-4 sm:p-6 md:p-8">{children}</div>
        </main>
      </div>
    </RouteGuard>
  );
}
