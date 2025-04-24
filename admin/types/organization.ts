

export interface RequesterInfo {
  _id: string;
  email: string;
  name: string;
}

export interface OrganizationRequest {
  _id: string;
  organizationName: string;
  status:
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'processing'
    | 'approved_with_changes';
  location: Location;
  requesterId: RequesterInfo;
  createdAt: string;
  updatedAt: string;
  images?: string[];
  ownerEmail:string
}

export interface OrganizationRequestsResponse {
  success: boolean;
  data: {
    requests: OrganizationRequest[];
    page: number;
    pages: number;
    total: number;
  };
  meta: {
    total: number;
    page: number;
    pages: number;
    filters: Record<string, unknown>;
  };
}

// Types
interface Coordinates {
  type: string;
  coordinates: number[];
}

interface Location {
  coordinates: Coordinates;
  place_id: string;
  address: string;
  city: string;
  area?: string;
  sub_area?: string;
  post_code?: string;
}

interface User {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Organization {
  location: Location;
  _id: string;
  name: string;
  facilities: string[];
  images: string[];
  turfs: string[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}