'use client';

import { useEffect, useState } from 'react';
import UserTable from '@/component/admin/users/UserTable';
import RoleAssignmentModal from '@/component/admin/users/RoleAssignmentModal';
import { Role, User } from '@/component/admin/users/types';
import axios from 'axios';

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [globalRoles, setGlobalRoles] = useState<Role[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/v1/users');
        setUsers(response.data.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Fetch global roles
  useEffect(() => {
    const fetchGlobalRoles = async () => {
      try {
        const response = await axios.get('/api/v1/roles/global');
        setGlobalRoles(response.data.data);
      } catch (err) {
        console.error('Error fetching global roles:', err);
        // We don't set the main error state here as users are more important
      }
    };

    fetchGlobalRoles();
  }, []);

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) return;

    try {
      await axios.post(`/api/v1/users/${selectedUser._id}/assignments/global`, {
        roleId: selectedRole
      });
      
      // Show success message (you could use a toast notification here)
      alert(`Role successfully assigned to ${selectedUser.name}`);
      
      // Reset modal state
      setSelectedUser(null);
      setSelectedRole('');
    } catch (err) {
      console.error('Error assigning role:', err);
      alert('Failed to assign role. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mt-4">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 text-red-600 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
      <p className="mt-2 text-sm text-gray-700">A list of all users in your application.</p>

      {users.length === 0 ? (
        <div className="mt-8 text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No users found.</p>
        </div>
      ) : (
        <div className="mt-8 overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <UserTable 
            users={users} 
            canAssignRoles={true} 
            onAssignClick={setSelectedUser} 
          />
        </div>
      )}

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