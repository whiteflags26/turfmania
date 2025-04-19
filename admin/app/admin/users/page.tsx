'use client';

import RoleAssignmentModal from '@/component/admin/users/RoleAssignmentModal';
import { Role, User } from '@/component/admin/users/types';
import UserTable from '@/component/admin/users/UserTable';
import { useState } from 'react';


const dummyUsers: User[] = [
  { _id: '1', name: 'Alice', email: 'alice@example.com', createdAt: new Date().toISOString() },
  { _id: '2', name: 'Bob', email: 'bob@example.com', createdAt: new Date().toISOString() },
];

const dummyRoles: Role[] = [
  { _id: 'admin', name: 'Admin', scope: 'global' },
  { _id: 'editor', name: 'Editor', scope: 'global' },
];

export default function UsersManagement() {
  const [users] = useState<User[]>(dummyUsers);
  const [globalRoles] = useState<Role[]>(dummyRoles);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState('');

  const handleAssignRole = () => {
    if (!selectedUser || !selectedRole) return;
    alert(`Role '${selectedRole}' assigned to ${selectedUser.name}`);
    setSelectedUser(null);
    setSelectedRole('');
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
      <p className="mt-2 text-sm text-gray-700">A list of all users in your application.</p>

      <div className="mt-8 overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <UserTable users={users} canAssignRoles={true} onAssignClick={setSelectedUser} />
      </div>

      {selectedUser && (
        <RoleAssignmentModal
          user={selectedUser}
          roles={globalRoles}
          selectedRole={selectedRole}
          onClose={() => setSelectedUser(null)}
          onChange={setSelectedRole}
          onAssign={handleAssignRole}
        />
      )}
    </div>
  );
}
