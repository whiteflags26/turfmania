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

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, isAdmin?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isAdmin: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Check if there's an admin session cookie first
        const adminResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/admin/me`,
          {
            credentials: "include", // Important for sending cookies
          }
        );

        if (adminResponse.ok) {
          const data = await adminResponse.json();
          setUser(data.data);
          setIsAdmin(true);
        } else {
          // If not admin, check regular user status
          const userResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/me`,
            {
              credentials: "include",
            }
          );

          if (userResponse.ok) {
            const data = await userResponse.json();
            setUser(data.data);
            setIsAdmin(false);
          } else {
            setUser(null);
            setIsAdmin(false);
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setUser(null);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string, isAdmin: boolean = false) => {
    try {
      // Use the appropriate endpoint based on whether this is an admin login
      const endpoint = isAdmin 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/admin/login`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/login`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "Login failed");
      }

      setUser(data.data.user);
      setIsAdmin(isAdmin);
      
      // Redirect based on user type
      if (isAdmin) {
        router.push("/admin/dashboard");
      } else {
        router.push("/");
      }
      
      router.refresh();
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const logout = async () => {
    try {
      // Use the appropriate endpoint based on whether the user is an admin
      const endpoint = isAdmin
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/admin/logout`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/logout`;
        
      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        setUser(null);
        setIsAdmin(false);
        
        // Redirect based on user type
        if (isAdmin) {
          router.push("/admin/login");
        } else {
          router.push("/sign-in");
        }
        
        router.refresh();
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const value = useMemo(
    () => ({ user, login, logout, isLoading, isAdmin }),
    [user, isLoading, isAdmin]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};