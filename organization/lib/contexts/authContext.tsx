"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/types/api-error";
import { IUser } from "@/types/user";

interface AuthContextType {
  user: IUser | null;
  login: (
    email: string,
    password: string,
    organizationId: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  organizationId: string | null;
}

const OrganizationAuthContext = createContext<AuthContextType | null>(null);

export function OrganizationAuthProvider({
  children,
  initialOrganizationId,
}: Readonly<{
  children: ReactNode;
  initialOrganizationId?: string;
}>) {
  const [user, setUser] = useState<IUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(
    initialOrganizationId || null
  );
  const router = useRouter();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        if (!organizationId) {
          // If no organizationId is available, we can't authenticate
          setUser(null);
          setIsLoading(false);
          return;
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/me`,
          {
            credentials: "include", // Important for sending cookies
          }
        );

        if (response.ok) {
          const data = await response.json();
          setUser(data.data);
        } else {
          setUser(null);
          // Redirect to login if not authenticated
          router.push(`/organization/${organizationId}/sign-in`);
        }
      } catch (error) {
        console.error("Organization auth check failed:", error);
        setUser(null);
        // Redirect to login on error
        if (organizationId) {
          router.push(`/organization/${organizationId}/sign-in`);
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, [organizationId, router]);

  const login = async (email: string, password: string, orgId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/organization/${orgId}/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "Organization login failed");
      }

      setUser(data.data.user);
      setOrganizationId(orgId);
      router.push(`/organization/${orgId}/dashboard`);
      router.refresh();
    } catch (err) {
      const error = err as ApiError;
      throw new Error(error.message);
    }
  };

  const logout = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/logout`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (response.ok) {
        setUser(null);
        // Redirect to the organization's login page if organizationId is available
        if (organizationId) {
          router.push(`/organization/${organizationId}/sign-in`);
        } else {
          router.push("/");
        }
        router.refresh();
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const value = useMemo(
    () => ({ user, login, logout, isLoading, organizationId }),
    [user, isLoading, organizationId] // `login` and `logout` are stable and don't need to be dependencies
  );

  return (
    <OrganizationAuthContext.Provider value={value}>
      {children}
    </OrganizationAuthContext.Provider>
  );
}

export const useOrganizationAuth = () => {
  const context = useContext(OrganizationAuthContext);
  if (!context) {
    throw new Error(
      "useOrganizationAuth must be used within an OrganizationAuthProvider"
    );
  }
  return context;
};
