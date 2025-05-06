"use client";

import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <Link href="/" className="flex items-center">
              <Image src="/images/TurfMania.png" alt="TurfMania" width={130} height={30} />
            </Link>
          </div>
          
          <nav className="flex gap-6 text-sm">
            <Link href="/about" className="text-slate-600 hover:text-green-600 transition-colors">
              About
            </Link>
            <Link href="/venues" className="text-slate-600 hover:text-green-600 transition-colors">
              Venues
            </Link>
            <Link href="/organization-request" className="text-slate-600 hover:text-green-600 transition-colors">
              Register Venue
            </Link>
          </nav>
        </div>
        
        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center">
          <p className="text-xs text-slate-500">
            © {currentYear} TurfMania. All rights reserved.
          </p>
          <p className="text-xs text-slate-500 mt-2 md:mt-0">
            Your Game, Your Turf, Your Time
          </p>
        </div>
      </div>
    </footer>
  );
}