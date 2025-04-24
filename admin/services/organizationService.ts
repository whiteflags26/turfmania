import api from '@/lib/axios';
import { OrganizationRequestsResponse } from '@/types/organization';

export interface RequestFilters {
  requesterEmail: string;
  ownerEmail: string;
  status: string[];
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export async function getOrganizationRequests(
  filters: RequestFilters,
): Promise<OrganizationRequestsResponse> {
  try {
    console.log('Sending filters to API:', filters);
    const { data } = await api.get('/api/v1/organization-requests', {
      params: filters,
      withCredentials: true,
    });
    console.log('Received response:', data);
    return data;
  } catch (error: any) {
    console.error('API Error:', error.response?.data);
    throw new Error(
      error.response?.data?.message ?? 'Failed to fetch organization requests',
    );
  }
}

export async function getSingleOrganizationRequest(
  requestId: string,
): Promise<OrganizationRequestsResponse> {
  try {
    const { data } = await api.get(
      `/api/v1/organization-requests/admin/${requestId}`,
      {
        withCredentials: true,
      },
    );
    return data;
  } catch (error: any) {
    console.error('API Error:', error.response?.data);
    throw new Error(
      error.response?.data?.message ?? 'Failed to fetch organization request',
    );
  }
}

