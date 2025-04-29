export interface Coordinates {
  type: string;
  coordinates: number[];
}

export interface Location {
  coordinates: Coordinates;
  place_id: string;
  address: string;
  area: string;
  sub_area: string;
  city: string;
  post_code: string;
}

export interface Organization {
  _id: string;
  name: string;
  location: Location;
}

export interface OperatingHour {
  day: number; // 0-6 (Sunday to Saturday)
  open: string; // "HH:MM"
  close: string; // "HH:MM"
}

export interface Turf {
  _id: string;
  organization: Organization;
  name: string;
  basePrice: number;
  sports: string[];
  team_size: number;
  images: string[];
  operatingHours: OperatingHour[];
  reviews: string[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface ApiResponse<T> {
  success: boolean;
  count: number;
  data: T;
}