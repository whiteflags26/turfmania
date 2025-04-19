'use client';

import { useState } from 'react';
import CreateRoleModal from '../../../component/admin/roles/CreateRoleModal';
import RoleTable from '../../../component/admin/roles/RoleTable';
import { Permission, Role } from '../../../component/admin/roles/types';

export default function RolesManagement() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [roleScope, setRoleScope] = useState('global');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isDefault, setIsDefault] = useState(false);

  // Dummy permissions data matching Permission interface
  const permissions: Permission[] = [
    {
      _id: 'read_1',
      name: 'Read Access',
      description: 'Can read resources',
      scope: 'global',
    },
    {
      _id: 'write_1',
      name: 'Write Access',
      description: 'Can write resources',
      scope: 'project',
    },
    {
      _id: 'delete_1',
      name: 'Delete Access',
      description: 'Can delete resources',
      scope: 'project',
    },
  ];

  // Dummy roles data matching Role interface
  const roles: Role[] = [
    {
      _id: '1',
      name: 'Admin',
      scope: 'global',
      permissions: [permissions[0], permissions[1], permissions[2]],
      isDefault: true,
    },
    {
      _id: '2',
      name: 'Viewer',
      scope: 'project',
      permissions: [permissions[0]],
      isDefault: false,
    },
  ];

  const canCreateRoles = true;

  const handleCreateRole = () => {
    console.log('Creating role:', {
      name: roleName,
      scope: roleScope,
      permissions: selectedPermissions.map(
        id => permissions.find(p => p._id === id)!,
      ),
      isDefault,
    });
    setIsCreateModalOpen(false);
    resetForm();
  };

  const handleDeleteRole = (id: string) => {
    console.log('Deleting role with ID:', id);
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
    setRoleScope('global');
    setSelectedPermissions([]);
    setIsDefault(false);
  };



  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Roles</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage roles and their permissions in your application.
          </p>
        </div>
        {canCreateRoles && (
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Create New Role
            </button>
          </div>
        )}
      </div>

      <RoleTable
        roles={roles}
        canDelete={canCreateRoles}
        onDelete={handleDeleteRole}
      />

      {isCreateModalOpen && (
        <CreateRoleModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            resetForm();
            setIsCreateModalOpen(false);
          }}
          onSubmit={handleCreateRole}
          permissions={permissions}
          scope={roleScope}
          onScopeChange={setRoleScope}
          selectedPermissions={selectedPermissions}
          togglePermission={togglePermission}
          name={roleName}
          setName={setRoleName}
          isDefault={isDefault}
          setIsDefault={setIsDefault}
        />
      )}
    </div>
  );
}
