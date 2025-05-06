"use client";

import { redirect } from "next/navigation";
import { useEffect } from "react";
import ProfileContent from "@/components/profile/ProfileContent";
import { useAuth } from "@/lib/contexts/authContext";

export default function ProfilePage() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      redirect("/sign-in");
    }
  }, [user, isLoading]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="animate-pulse">
            <div className="bg-white rounded-xl shadow-lg p-8 h-64"></div>
            <div className="bg-white rounded-xl shadow-lg p-8 h-96 mt-8"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {user && <ProfileContent initialUser={user} />}
      </div>
    </main>
  );
}
