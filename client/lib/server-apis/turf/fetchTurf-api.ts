import { ITurfFilters } from "@/types/turfFilter";
import { IPagination } from "@/types/pagination";

export async function fetchTurfs(
  filters: ITurfFilters,
  pagination: IPagination
) {
  const params = new URLSearchParams();

  // Helper to append a single-valued param if it’s neither undefined nor empty
  const appendParam = (key: string, value: string | number | undefined) => {
    if (value !== undefined && value !== "") {
      params.append(key, value.toString());
    }
  };

  // 1) Append all single-value filters in one go
  ([
    "minPrice",
    "maxPrice",
    "radius",
    "latitude",
    "longitude",
    "preferredDate",
    "preferredTimeStart",
    "preferredTimeEnd",
  ] as const).forEach((key) => {
    
    appendParam(key, filters[key]);
  });

  // 2) Append all multi-value filters via a shared loop
  (["teamSize", "facilities", "sports"] as const).forEach((key) => {
   
    const arr = filters[key];
    if (Array.isArray(arr)) {
      arr.forEach((v) => {
        if (v !== undefined && v !== "") {
          params.append(key, v.toString());
        }
      });
    }
  });

  // 3) Append pagination
  appendParam("page", pagination.currentPage);
  appendParam("limit", pagination.limit);

  // 4) Fetch, check, and return
  const url = `/api/v1/turf/filter/search?${params.toString()}`;
  const res = await fetch(url);

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message ?? "Failed to fetch turfs");
  }

  return await res.json();
}
