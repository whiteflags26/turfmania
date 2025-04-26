import api from '@/lib/axios';
import {
  OrganizationRequestsResponse,
  SingleOrganizationResponse,
} from '@/types/organization';

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
): Promise<SingleOrganizationResponse> {
  try {
    const { data } = await api.get(
      `/api/v1/organization-requests/admin/${requestId}`,
      {
        withCredentials: true,
      },
    );
    return data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ?? 'Failed to fetch organization request',
    );
  }
}

export async function processOrganizationRequest(
  requestId: string,
): Promise<{ success: boolean; data: OrganizationRequestsResponse }> {
  try {
    const response = await api.put(
      `/api/v1/organization-requests/${requestId}/process`,
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ?? 'Failed to process request',
    );
  }
}
export async function CancelProcessOrganizationRequest(
  requestId: string,
): Promise<{ success: boolean; data: OrganizationRequestsResponse }> {
  try {
    const response = await api.put(
      `/api/v1/organization-requests/${requestId}/cancel-processing`,
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ?? 'Failed to process request',
    );
  }
}

export async function rejectOrganizationRequest(
  requestId: string,
  adminNotes: string,
): Promise<{ success: boolean; data: OrganizationRequestsResponse }> {
  try {
    const requestData = {
      adminNotes: adminNotes,
    };
    const response = await api.put(
      `/api/v1/organization-requests/${requestId}/reject`,
      requestData,
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ?? 'Failed to process request',
    );
  }
}

export async function createOrganization(
  payload: any,
): Promise<SingleOrganizationResponse> {
  try {
    const response = await api.post('/api/v1/organizations', payload, {
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    return response.data;
  } catch (error: any) {
    console.error('Create organization error:', error.response?.data);
    throw new Error(
      error.response?.data?.message ?? 'Failed to create organization',
    );
  }
}

export async function getAllFacilities(): Promise<any> {
   try {
    const response = await api.get('/api/v1/facilities', {
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    return response.data;
  } catch (error: any) {
    console.error('While fetching facilities:', error.response?.data);
    throw new Error(
      error.response?.data?.message ?? 'Failed to create organization',
    );
  }
}
