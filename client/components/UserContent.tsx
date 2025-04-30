"use client";

import { CircleUserRound, CircleChevronDown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/Button";
import { IUser } from "@/types/user";


interface UserContentProps {
  user: IUser | null;
  isLoading: boolean;
  logout: () => void;
}

const UserContent = ({ user, isLoading, logout }: UserContentProps) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (isLoading) {
    return <span className="text-lg text-gray-700">Loading User...</span>;
  }

  if (user) {
    return (
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 text-lg text-gray-700 hover:text-green-700"
        >
          <CircleUserRound className="w-8 h-8 text-gray-500" />
          {user.first_name} {user.last_name}
          <CircleChevronDown className="w-4 h-4" />
        </button>
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white border border-gray-200">
            <Link
              href="/profile"
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              View Profile
            </Link>
            <button
              onClick={logout}
              className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <Button href="/sign-in" variant="default" className="hidden lg:inline-flex px-7">
      Sign In
    </Button>
  );
};

export default UserContent;