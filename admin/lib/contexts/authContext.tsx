"use client";

import axios from "axios";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface UserPermissions {
  name: string;
  scope: string;
}

interface User {
  _id: string;
  email: string;
  first_name: string;
  last_name: string;
  isAdmin?: boolean;
  permissions?: UserPermissions[];
  role?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  checkAuth: () => Promise<boolean>;
  logout: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  hasPermission: (permissionName: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { readonly children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const checkAuth = async (): Promise<boolean> => {
    try {
      console.log("Checking auth status...");
      const response = await axios.get(
        `/api/v1/auth/me`,
        {
          withCredentials: true,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200 && response.data?.data) {
        console.log("User authenticated:", response.data.data);
        setUser(response.data.data);
        return true;
      }

      console.log("No user data in response");
      setUser(null);
      return false;
    } catch (error) {
      // Don't log errors when on the login page
      if (pathname !== "/") {
        if (axios.isAxiosError(error)) {
          console.error("Auth check failed:", {
            status: error.response?.status,
            message: error.response?.data?.message,
            error: error.message,
          });
        } else {
          console.error("Auth check failed with unknown error:", error);
        }
      }

      setUser(null);
      // Only redirect if not already on sign-in page and not loading
      if (pathname !== "/" && !loading) {
        console.log("Redirecting to sign-in page...");
        router.push("/");
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    try {
      console.log("Attempting login...");
      const response = await axios.post(
        `/api/v1/auth/admin/login`,
        { email, password },
        {
          withCredentials: true,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Login response:", response.data);

      if (response.status === 200 && response.data?.data?.user) {
        console.log("Login successful, user:", response.data.data.user);
        setUser(response.data.data.user);
        router.push("/admin/dashboard");
        return;
      }
      throw new Error("Login failed - Invalid response format");
    } catch (error) {
      console.error("Login error:", {
        error: axios.isAxiosError(error)
          ? {
              status: error.response?.status,
              message: error.response?.data?.message,
              error: error.message,
            }
          : error,
      });

      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message ?? "Login failed");
      }
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await axios.post(
        `/api/v1/auth/logout`,
        {},
        {
          withCredentials: true,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );
      setUser(null);
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const hasPermission = (permissionName: string): boolean => {
    return user?.permissions?.some((p) => p.name === permissionName) ?? false;
  };

  useEffect(() => {
    const initAuth = async () => {
      console.log("Initializing auth check on path:", pathname);
      await checkAuth();
    };

    initAuth();
  }, [pathname]);
  const authContextValue = useMemo(
    () => ({
      user,
      loading,
      checkAuth,
      logout,
      login,
      hasPermission,
    }),
    [user, loading, checkAuth, logout, login, hasPermission]
  );

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
