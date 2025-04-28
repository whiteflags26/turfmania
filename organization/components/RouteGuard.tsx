// app/component/RouteGuard.tsx

"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/contexts/authContext";
import LoadingScreen from "@/components/LoadingScreen";
import { hasOrgAccess } from "@/service/auth";

interface RouteGuardProps {
  children: ReactNode;
}

export default function RouteGuard({ children }: RouteGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    // Authentication check function
    const checkAuth = async () => {
      setCheckingAccess(true);

      // If not authenticated and not on auth pages, redirect to login
      if (!user && !isLoading) {
        router.push("/sign-in");
        return;
      }
      // If authenticated, check if route requires org access
      if (user && pathname.startsWith("/dashboard/")) {
        // Extract org ID from URL (/dashboard/{orgId}/...)
        const orgId = pathname.split("/")[2];

        if (orgId) {
          try {
            const { hasAccess } = await hasOrgAccess(orgId);

            if (!hasAccess) {
              router.push("/unauthorized");
              return;
            }
          } catch (error) {
            console.error("Error checking organization access:", error);
            router.push("/error");
            return;
          }
        }
      }

      setAuthorized(true);
      setCheckingAccess(false);
    };

    checkAuth();
  }, [user, isLoading, pathname, router]);

  // Show loading while checking authentication
  if (isLoading || checkingAccess) {
    return <LoadingScreen />;
  }

  // If authorized, show the page
  return authorized ? <>{children}</> : null;
}
