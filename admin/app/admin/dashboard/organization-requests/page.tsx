'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

import { FilterPanel } from '@/component/admin/organization-requests/FilterPanel';
import { RequestsTable } from '@/component/admin/organization-requests/RequestTable';
import {
  getOrganizationRequests,
  RequestFilters,
} from '@/services/organizationService';
import { OrganizationRequestsResponse } from '@/types/organization';

export default function OrganizationRequestsPage() {
  const [filters, setFilters] = useState<RequestFilters>({
    requesterEmail: '',
    ownerEmail: '',
    status: [],
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const [data, setData] = useState<OrganizationRequestsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await getOrganizationRequests(filters);

      if (!response || !response.data || !response.data.requests) {
        throw new Error('Invalid response format');
      }

      setData(response.data);
      toast.success('Data loaded successfully');
    } catch (err: any) {
      console.error('Failed to fetch organization requests:', err);
      setError(err.message || 'Failed to load organization requests');
      toast.error(err.message || 'Failed to load organization requests');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => fetchData();
  const goToPage = (page: number) => setFilters((prev) => ({ ...prev, page }));
  const changeLimit = (limit: number) =>
    setFilters((prev) => ({ ...prev, limit, page: 1 }));

  const totalPages = data ? Math.ceil(data.total / filters.limit) : 0;
  const startItem = data ? (data.page - 1) * filters.limit + 1 : 0;
  const endItem = data ? Math.min(startItem + filters.limit - 1, data.total) : 0;

  const getVisiblePageNumbers = (
    currentPage: number,
    totalPages: number,
    maxPages = 5
  ): number[] => {
    let start = Math.max(1, currentPage - 2);
    if (start + maxPages - 1 > totalPages) {
      start = Math.max(1, totalPages - maxPages + 1);
    }
    return Array.from({ length: Math.min(maxPages, totalPages) }, (_, i) => start + i);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organization Requests</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and review all organization registration requests
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Refresh
        </button>
      </header>

      <FilterPanel filters={filters} setFilters={setFilters} />

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mt-6">
          <p>{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-2 text-sm font-medium text-red-700 underline"
          >
            Try again
          </button>
        </div>
      ) : !data?.requests?.length ? (
        <div className="text-center py-12 text-gray-500">
          No organization requests found
        </div>
      ) : (
        <>
          <RequestsTable data={data.requests} />

          <div className="mt-6 flex flex-col sm:flex-row justify-between items-center bg-white px-4 py-3 border border-gray-200 rounded-lg shadow-sm">
            <div className="text-sm text-gray-700 mb-4 sm:mb-0">
              Showing <span className="font-medium">{startItem}</span> to{' '}
              <span className="font-medium">{endItem}</span> of{' '}
              <span className="font-medium">{data.total}</span> results
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={filters.limit}
                onChange={(e) => changeLimit(Number(e.target.value))}
                className="block w-full sm:w-auto rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              >
                {[5, 10, 25, 50].map((size) => (
                  <option key={size} value={size}>
                    {size} per page
                  </option>
                ))}
              </select>

              <nav className="inline-flex rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => goToPage(filters.page - 1)}
                  disabled={filters.page === 1}
                  className={`px-2 py-2 border rounded-l-md ${
                    filters.page === 1
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {getVisiblePageNumbers(filters.page, totalPages).map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`px-4 py-2 border text-sm font-medium ${
                      filters.page === page
                        ? 'bg-blue-100 text-blue-700 border-blue-500'
                        : 'text-gray-500 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => goToPage(filters.page + 1)}
                  disabled={filters.page === totalPages}
                  className={`px-2 py-2 border rounded-r-md ${
                    filters.page === totalPages
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </nav>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
