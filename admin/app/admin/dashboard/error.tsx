'use client';

import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-red-50 p-6 flex items-center justify-center">
          <div className="flex-shrink-0">
            <AlertTriangle
              className="h-12 w-12 text-red-600"
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              Something went wrong
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              We're sorry, but we encountered an error while processing your
              request.
            </p>

            <div className="mb-6 p-3 bg-gray-50 rounded-md text-xs text-left overflow-auto max-h-32">
              <p className="font-mono text-red-600">
                {error.message || 'An unknown error occurred'}
              </p>
              {error.digest && (
                <p className="font-mono text-gray-500 mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={reset}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Try again
              </button>

              <Link
                href="/admin/dashboard"
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Return to dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
