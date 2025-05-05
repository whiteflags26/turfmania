
"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import {
  motion,
  useScroll,
  useMotionValueEvent,
  AnimatePresence,
} from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Menu, X } from "lucide-react";
import { NAV_LINKS } from "@/constants";
import { Button } from "@/components/Button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/contexts/authContext";
import {
  fetchSuggestions,
  fetchSearchResults,
} from "@/lib/server-apis/search/search-api";
import { ISuggestion, ISearchResult, SearchPagination } from "@/types/search";

// Import the components we've just created
import UserContent from "@/components/UserContent";
import SuggestionsDropdown from "./SuggestionsDropDown";
import SearchResultsModalContent from "@/components/SearchResultsModalContent";

const Navbar = () => {
  const [isHidden, setIsHidden] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, isLoading, logout } = useAuth();

  // Search related states
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ISuggestion[]>([]);
  const [isLoading_suggestions, setIsLoading_suggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Search results modal states
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchResults, setSearchResults] = useState<ISearchResult[]>([]);
  const [searchPagination, setSearchPagination] = useState<SearchPagination | null>(null);
  const [isLoadingResults, setIsLoadingResults] = useState(false);

  const router = useRouter();
  const { scrollY } = useScroll();
  const lastYRef = useRef(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useMotionValueEvent(scrollY, "change", (y) => {
    const difference = y - lastYRef.current;
    if (Math.abs(difference) > 50) {
      setIsHidden(difference > 0);
      lastYRef.current = y;
    }
    setIsScrolled(y > 10);
  });

  // Handle click outside search container
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchExpanded(false);
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle click outside modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setShowSearchModal(false);
      }
    };

    if (showSearchModal) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSearchModal]);

  // Fetch search suggestions
  useEffect(() => {
    const fetchSuggestionsDebounced = async () => {
      if (searchQuery.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading_suggestions(true);
      try {
        const data = await fetchSuggestions(searchQuery);
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
      } catch (error) {
        console.error("Search suggestion error:", error);
        setSuggestions([]);
      } finally {
        setIsLoading_suggestions(false);
      }
    };

    // Debounce search requests
    const debounceTimer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        fetchSuggestionsDebounced();
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleSearchClick = () => {
    setIsSearchExpanded(true);

    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 300);
  };

  const handleSearchClear = () => {
    setSearchQuery("");
    setShowSuggestions(false);
    setShowSearchModal(false);
    searchInputRef.current?.focus();
  };

  const handleSearchSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsLoadingResults(true);
      try {
        const data = await fetchSearchResults(searchQuery.trim());
        if (data) {
          setSearchResults(data.results);
          setSearchPagination(data.pagination);
          setShowSearchModal(true);
        }
      } catch (error) {
        console.error("Search results error:", error);
      } finally {
        setIsLoadingResults(false);
      }
      setIsSearchExpanded(false);
      setShowSuggestions(false);
    }
  };

  const handleLoadMoreResults = async () => {
    if (searchPagination && searchPagination.page < searchPagination.pages) {
      setIsLoadingResults(true);
      try {
        const data = await fetchSearchResults(
          searchQuery.trim(),
          searchPagination.page + 1
        );
        if (data) {
          setSearchResults((prevResults) => [...prevResults, ...data.results]);
          setSearchPagination(data.pagination);
        }
      } catch (error) {
        console.error("Search results error:", error);
      } finally {
        setIsLoadingResults(false);
      }
    }
  };

  const handleSuggestionClick = (suggestion: ISuggestion) => {
    if (suggestion.type === "turf") {
      router.push(`/venues/${suggestion._id}`);
    } else {
      router.push(`/organizations/${suggestion._id}`);
    }
    setIsSearchExpanded(false);
    setShowSuggestions(false);
  };

  const handleCloseModal = () => {
    setShowSearchModal(false);
  };

  return (
    <>
      <motion.div
        animate={isHidden ? "hidden" : "visible"}
        whileHover="visible"
        onFocusCapture={() => setIsHidden(false)}
        variants={{
          hidden: { y: "-90%" },
          visible: { y: "0%" },
        }}
        transition={{ duration: 0.2 }}
        className={`fixed top-1 z-10 w-full mx-2 ${
          isScrolled ? "border border-gray-400 rounded-3xl" : ""
        } bg-white`}
      >
        <nav className="mx-auto flex items-center justify-between rounded-3xl bg-white p-4">
          <div className="flex items-center gap-10">
            <Link href="/" className="text-2xl font-bold">
              TurfMania
            </Link>
            <div className="hidden space-x-4 lg:flex">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.key}
                  href={link.href}
                  className="relative px-3 py-1 text-lg text-gray-700 transition-colors duration-300 hover:text-green-700"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div ref={searchContainerRef} className="relative hidden lg:block">
              <motion.div
                animate={isSearchExpanded ? "expanded" : "collapsed"}
                variants={{
                  expanded: { width: "300px" },
                  collapsed: { width: "40px" },
                }}
                transition={{ duration: 0.3 }}
                className="flex items-center"
              >
                <form onSubmit={handleSearchSubmit} className="w-full">
                  <Input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search turf, organization, sport..."
                    className={`w-full rounded-full border-gray-300 pl-10 pr-8 focus:border-black transition-opacity ${
                      isSearchExpanded ? "opacity-100" : "opacity-0"
                    }`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() =>
                      setShowSuggestions(searchQuery.trim().length >= 2)
                    }
                  />
                </form>
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 transform cursor-pointer text-gray-400"
                  onClick={handleSearchClick}
                />
                {isSearchExpanded && searchQuery && (
                  <X
                    className="absolute right-3 top-1/2 -translate-y-1/2 transform cursor-pointer text-gray-400 hover:text-gray-600"
                    size={16}
                    onClick={handleSearchClear}
                  />
                )}

                {/* Search suggestions dropdown */}
                <SuggestionsDropdown
                  isSearchExpanded={isSearchExpanded}
                  showSuggestions={showSuggestions}
                  isLoading={isLoading_suggestions}
                  suggestions={suggestions}
                  searchQuery={searchQuery}
                  handleSuggestionClick={handleSuggestionClick}
                  handleSearchSubmit={handleSearchSubmit}
                />
              </motion.div>
            </div>
            <UserContent user={user} isLoading={isLoading} logout={logout} />
            <Sheet>
              <SheetTrigger asChild>
                <Button className="lg:hidden">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Navigation</SheetTitle>
                  <SheetDescription>Search for turfs and more</SheetDescription>
                </SheetHeader>
                {/* Mobile search */}
                <div className="mt-4 mb-6 px-4">
                  <form onSubmit={handleSearchSubmit}>
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Search..."
                        className="w-full pr-8 pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() =>
                          setShowSuggestions(searchQuery.trim().length >= 2)
                        }
                      />
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-400" />
                      {searchQuery && (
                        <X
                          className="absolute right-3 top-1/2 -translate-y-1/2 transform cursor-pointer text-gray-400"
                          size={16}
                          onClick={handleSearchClear}
                        />
                      )}

                      {/* Mobile search suggestions dropdown */}
                      <SuggestionsDropdown
                        isSearchExpanded={true}
                        showSuggestions={showSuggestions}
                        isLoading={isLoading_suggestions}
                        suggestions={suggestions}
                        searchQuery={searchQuery}
                        handleSuggestionClick={handleSuggestionClick}
                        handleSearchSubmit={handleSearchSubmit}
                      />
                    </div>
                  </form>
                </div>
                {/* Navigation links - moved outside SheetDescription */}
                <div className="flex flex-col space-y-4 px-4">
                  {NAV_LINKS.map((link) => (
                    <Link
                      key={link.key}
                      href={link.href}
                      className="text-lg text-gray-700 transition-colors duration-300 hover:text-green-700"
                    >
                      {link.label}
                    </Link>
                  ))}
                  {!user && (
                    <Button
                      href="/sign-in"
                      variant="default"
                      className="w-full"
                    >
                      Sign In
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </motion.div>

      {/* Search Results Modal */}
      <AnimatePresence>
        {showSearchModal && (
          <SearchResultsModalContent
            modalRef={modalRef}
            searchQuery={searchQuery}
            searchResults={searchResults}
            searchPagination={searchPagination}
            isLoadingResults={isLoadingResults}
            handleCloseModal={handleCloseModal}
            handleLoadMoreResults={handleLoadMoreResults}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;