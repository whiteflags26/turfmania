'use client';

import { ISearchResult, SearchPagination } from '@/types/search';
import { motion } from 'framer-motion';
import { ExternalLink, Loader2, MapPin, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { RefObject } from 'react';

interface SearchResultsModalContentProps {
  modalRef: RefObject<HTMLDivElement | null>;
  searchQuery: string;
  searchResults: ISearchResult[];
  searchPagination: SearchPagination | null;
  isLoadingResults: boolean;
  handleCloseModal: () => void;
  handleLoadMoreResults: () => void;
}

const SearchResultsModalContent = ({
  modalRef,
  searchQuery,
  searchResults,
  searchPagination,
  isLoadingResults,
  handleCloseModal,
  handleLoadMoreResults,
}: SearchResultsModalContentProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <motion.div
        ref={modalRef as RefObject<HTMLDivElement>}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
        className="relative mx-4 max-w-4xl w-full max-h-[80vh] bg-white rounded-xl shadow-xl overflow-hidden"
      >
        {/* Modal header */}
        <div className="sticky top-0 z-10 bg-white px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold">Search Results</h3>
            <p className="text-sm text-gray-500">
              {searchPagination?.total ?? 0} results for &quot;{searchQuery}
              &quot;
            </p>
          </div>
          <button
            onClick={handleCloseModal}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          {isLoadingResults ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-green-600 mb-4" />
              <p className="text-gray-500">Loading search results...</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No results found</p>
              <p className="text-gray-400 mt-2">
                Try different keywords or filters
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {searchResults.map(result => (
                <div
                  key={result._id}
                  className="flex border rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200"
                >
                  <div className="w-1/3 h-32 bg-gray-100 relative">
                    {result.images && result.images.length > 0 ? (
                      <Image
                        src={result.images[0]}
                        alt={result.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="w-2/3 p-4 flex flex-col justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 line-clamp-1">
                        {result.name}
                      </h4>
                      <div className="flex items-center mt-1 text-sm text-gray-500">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span className="line-clamp-1">
                          {result.organization.location.address ||
                            result.organization.location.city}
                        </span>
                      </div>
                      {result.sports && result.sports.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {result.sports.slice(0, 2).map(sport => (
                            <span
                              key={sport}
                              className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded"
                            >
                              {sport}
                            </span>
                          ))}
                          {result.sports.length > 2 && (
                            <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
                              +{result.sports.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      {result.basePrice && (
                        <div className="text-green-700 font-medium">
                          ${result.basePrice}/hr
                        </div>
                      )}
                      <Link href={`/venues/${result._id}`} passHref>
                        <button className="text-xs flex items-center text-blue-600 hover:text-blue-800">
                          View <ExternalLink className="h-3 w-3 ml-1" />
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal footer */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-center items-center">
          {searchPagination &&
          searchPagination.page < searchPagination.pages ? (
            <button
              onClick={handleLoadMoreResults}
              className="text-green-600 hover:text-green-700 font-medium flex items-center"
              disabled={isLoadingResults}
            >
              {isLoadingResults ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading...
                </>
              ) : (
                'Load more'
              )}
            </button>
          ) : (
            <div></div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default SearchResultsModalContent;