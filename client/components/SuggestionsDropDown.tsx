'use client';

import { ISuggestion } from '@/types/search';
import { FormEvent } from 'react';

interface SuggestionsDropdownProps {
  isSearchExpanded: boolean;
  showSuggestions: boolean;
  isLoading: boolean;
  suggestions: ISuggestion[];
  searchQuery: string;
  handleSuggestionClick: (suggestion: ISuggestion) => void;
  handleSearchSubmit: (e: FormEvent) => Promise<void>;
}

const SuggestionsDropdown = ({
  isSearchExpanded,
  showSuggestions,
  isLoading,
  suggestions,
  searchQuery,
  handleSuggestionClick,
  handleSearchSubmit,
}: SuggestionsDropdownProps) => {
  if (!isSearchExpanded || !showSuggestions) {
    return null;
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg z-20">
      {isLoading && (
        <div className="p-4 text-center text-gray-500">Loading...</div>
      )}

      {!isLoading && suggestions.length > 0 && (
        <div>
          {suggestions.map(suggestion => (
            <button
              key={`${suggestion.type}-${suggestion._id}`}
              type="button"
              className="w-full text-left cursor-pointer px-4 py-2 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="font-medium">{suggestion.name}</div>
              <div className="flex items-center text-xs text-gray-500">
                <span className="mr-2 rounded bg-gray-100 px-1 py-0.5 text-gray-700">
                  {suggestion.type === 'turf' ? 'Turf' : 'Organization'}
                </span>
                {suggestion.location && <span>{suggestion.location}</span>}
                {suggestion.sport && (
                  <span className="ml-2 rounded bg-green-100 px-1 py-0.5 text-green-700">
                    {suggestion.sport}
                  </span>
                )}
              </div>
            </button>
          ))}

          <div className="border-t border-gray-100 p-2">
            <button
              onClick={handleSearchSubmit}
              className="text-sm text-green-600 hover:text-green-700 w-full text-center"
            >
              See all results for &quot;{searchQuery}&quot;
            </button>
          </div>
        </div>
      )}

      {!isLoading &&
        suggestions.length === 0 &&
        searchQuery.trim().length >= 2 && (
          <div className="p-4 text-center text-gray-500">
            No results found for &quot;{searchQuery}&quot;
          </div>
        )}
    </div>
  );
};

export default SuggestionsDropdown;
