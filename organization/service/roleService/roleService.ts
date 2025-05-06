import api from '@/lib/axios';

interface RoleData {
  name: string;
  permissions: string[];
  isDefault: string;
}

// Fix the template string with backticks
export async function getAllRole(orgId: string) {
  const res = await api.get(`/api/v1/organizations/${orgId}/roles`);
  return res.data;
}

export async function deleteRole(orgId: string, roleId: string) {
  const res = await api.delete(
    `/api/v1/organizations/${orgId}/roles/${roleId}`,
  );
  return res.data;
}

export async function getAllRolePermissions(orgId: string, roleId: string) {
  const res = await api.get(
    `/api/v1/organizations/${orgId}/roles/${roleId}/permissions`,
  );
  return res.data;
}

export async function createRole(orgId: string, roleData: RoleData) {
  // Validate data before sending
  if (!roleData.name || !roleData.permissions?.length) {
    throw new Error('Name and permissions are required');
  }

  // Ensure we're using the correct data structure
  const requestData = {
    roleName: roleData.name, // Changed from 'name' to 'roleName'
    permissions: roleData.permissions,
    isDefault: roleData.isDefault === 'true', // Fixed capitalization and converted to boolean
  };

  // Fix URL path
  const response = await api.post(
    `/api/v1/organizations/${orgId}/roles`,
    requestData,
  );
  return response.data;
}
