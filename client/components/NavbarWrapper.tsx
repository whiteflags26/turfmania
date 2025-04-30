'use client';

import { authRoutes } from '@/constants';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

// Dynamically import Navbar with no SSR
const Navbar = dynamic(() => import('@/components/Navbar'), {
  ssr: false,
});

export default function NavbarWrapper() {
  const pathname = usePathname();
  const isAuthRoute = authRoutes.includes(pathname ?? '');

  return <>{!isAuthRoute && <Navbar />}</>;
}
