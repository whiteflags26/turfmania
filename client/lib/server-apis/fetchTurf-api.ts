export interface TurfFilters {
  minPrice?: string;
  maxPrice?: string;
  sports?: string[];
  teamSize?: string[];
  facilities?: string[];
  radius?: string;
  latitude?: string;
  longitude?: string;
  preferredDate?: string;
  preferredTimeStart?: string;
  preferredTimeEnd?: string;
}

export interface PaginationQuery {
  currentPage: number;
  limit: number;
}

export async function fetchTurfs(
  filters: TurfFilters,
  pagination: PaginationQuery
) {
  const params = new URLSearchParams();

  if (filters.minPrice) params.append("minPrice", filters.minPrice);
  if (filters.maxPrice) params.append("maxPrice", filters.maxPrice);
  if (filters.teamSize && filters.teamSize.length > 0) {
    filters.teamSize.forEach((size) => params.append("teamSize", size));
  }
  if (filters.facilities && filters.facilities.length > 0) {
    filters.facilities.forEach((f) => params.append("facilities", f));
  }
  if (filters.radius) params.append("radius", filters.radius);
  if (filters.latitude) params.append("latitude", filters.latitude);
  if (filters.longitude) params.append("longitude", filters.longitude);
  if (filters.sports && filters.sports.length > 0) {
    filters.sports.forEach((sport) => params.append("sports", sport));
  }
  if (filters.preferredDate)
    params.append("preferredDate", filters.preferredDate);
  if (filters.preferredTimeStart)
    params.append("preferredTimeStart", filters.preferredTimeStart);
  if (filters.preferredTimeEnd)
    params.append("preferredTimeEnd", filters.preferredTimeEnd);

  params.append("page", pagination.currentPage.toString());
  params.append("limit", pagination.limit.toString());

  const res = await fetch(
    `${
      process.env.NEXT_PUBLIC_API_URL
    }/api/v1/turf/filter/search?${params.toString()}`
  );

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to fetch turfs");
  }

  const data = await res.json();
  return data;
}
