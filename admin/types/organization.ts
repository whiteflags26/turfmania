export interface Location {
  address?: string;
  city?: string;
  country?: string;
}

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
