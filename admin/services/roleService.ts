import api from '@/lib/axios';
import axios from 'axios';

interface RoleData {
  name: string;
  permissions: string[];
  isDefault: string;
}

export async function getAllRole() {
  try {
    // Try the API endpoint with "roles" (plural)
    const res = await api.get('/api/v1/roles/global');
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 403) {
      throw new Error('You are not authorized to perform this action');
    }
    throw error;
  }
}

export async function deleteRole(roleId: string) {
  try {
    const res = await api.delete(`/api/v1/roles/${roleId}`);
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 403) {
      throw new Error('You are not authorized to perform this action');
    }
    throw error;
  }
}

export async function getAllRolePermissions(roleId: string) {
  try {
    const res = await api.get(`/api/v1/roles/${roleId}/permissions`);
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 403) {
      throw new Error('You are not authorized to perform this action');
    }
    throw error;
  }
}

export async function createRole(roleData: RoleData) {
  try {
    // Validate data before sending
    if (!roleData.name || !roleData.permissions?.length) {
      throw new Error('Name and permissions are required');
    }
    
    // Ensure we're using the correct data structure
    const requestData = {
      name: roleData.name,
      permissions: roleData.permissions,
      isdefault: roleData.isDefault || false,
    };
    
    // Make the API request with the roleData using the plural endpoint
    const response = await api.post('/api/v1/roles/global', requestData);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 403) {
      throw new Error('You are not authorized to perform this action');
    }
    throw error;
  }
}