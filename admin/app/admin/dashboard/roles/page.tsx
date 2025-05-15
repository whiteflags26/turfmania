'use client';

import api from '@/lib/axios';
import { handleAxiosError } from '@/lib/utils/handleAxiosError';
import { createRole, deleteRole, getAllRole } from '@/services/roleService';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import CreateRoleModal from '../../../../component/admin/roles/CreateRoleModal';
import RoleTable from '../../../../component/admin/roles/RoleTable';
import { Permission, Role } from '../../../../component/admin/roles/types';

export default function RolesManagement() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isDefault, setIsDefault] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch roles using roleService
        const rolesResponse = await getAllRole();

        // Fetch permissions
        const permissionsResponse = await api.get('/v1/permissions/global');

        setRoles(rolesResponse.data);
        setPermissions(permissionsResponse.data.data);
        setError(null);
      } catch (err) {
        // Check specifically for 403 Forbidden errors
        if (axios.isAxiosError(err) && err.response?.status === 403) {
          const errorMessage = "You are not authorized to perform this action";
          setError(errorMessage);
          toast.error(errorMessage);
        } else {
          const errorMessage = handleAxiosError(err, 'Error Fetching Permissions');
          setError(errorMessage);
          toast.error(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCreateRole = async () => {
    try {
      if (!roleName) {
        toast.error('Role name is required');
        return;
      }

      if (selectedPermissions.length === 0) {
        toast.error('Please select at least one permission');
        return;
      }

      setCreateError(null);
      
      const roleData = {
        name: roleName.trim(),
        permissions: selectedPermissions,
        isDefault: isDefault ? 'true' : 'false',
      };

      console.log('Sending role data from component:', roleData);

      try {
        const response = await createRole(roleData);
        console.log('Create role response:', response);
        
        // Add new role to state and show success message
        setRoles(prevRoles => [...prevRoles, response.data]);
        toast.success('Role created successfully!');
        setIsCreateModalOpen(false);
        resetForm();
      } catch (err: unknown) {
        console.error('Error in API call:', err);
        
        // Check specifically for 403 Forbidden errors
        if (axios.isAxiosError(err) && err.response?.status === 403) {
          const errorMessage = "You are not authorized to perform this action";
          setCreateError(errorMessage);
          toast.error(errorMessage);
        } else {
          const errorMessage = handleAxiosError(err, 'Error creating role');
          setCreateError(errorMessage);
          toast.error(errorMessage);
        }
      }
    } catch (err: unknown) {
      setError(handleAxiosError(err, 'Error creating role'));
      toast.error(error || "Unknown error occurred");
    }
  };

  const handleDeleteRole = async (id: string) => {
    try {
      await deleteRole(id);
      setRoles(prevRoles => prevRoles.filter(role => role._id !== id));
      toast.success('Role deleted successfully');
    } catch (err) {
      // Check specifically for 403 Forbidden errors
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        toast.error("You are not authorized to perform this action");
      } else {
        console.error('Error deleting role:', err);
        toast.error('Failed to delete role');
      }
    }
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(p => p !== permissionId)
        : [...prev, permissionId],
    );
  };

  const resetForm = () => {
    setRoleName('');
    setSelectedPermissions([]);
    setIsDefault(false);
    setCreateError(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  // If access is forbidden, show a friendly but clear message
  if (error && error.includes("not authorized")) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="flex flex-col items-center">
            <div className="rounded-full bg-red-100 p-3 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-3V6c0-1.657-1.343-3-3-3S6 4.343 6 6v2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-800">Access Denied</h3>
            <p className="mt-2 text-sm text-red-700">{error}</p>
            <p className="mt-1 text-sm text-red-700">Please contact your administrator for assistance.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Roles</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage roles and their permissions in your application.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Create New Role
          </button>
        </div>
      </div>

      <RoleTable roles={roles} canDelete={true} onDelete={handleDeleteRole} />

      {isCreateModalOpen && (
        <CreateRoleModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            resetForm();
            setIsCreateModalOpen(false);
          }}
          onSubmit={handleCreateRole}
          permissions={permissions}
          selectedPermissions={selectedPermissions}
          togglePermission={togglePermission}
          name={roleName}
          setName={setRoleName}
          isDefault={isDefault}
          setIsDefault={setIsDefault}
          loading={loading}
          error={createError}
        />
      )}
    </div>
  );
}
