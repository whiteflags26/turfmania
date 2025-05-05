'use client';

import RoleAssignmentModal from '@/component/admin/users/RoleAssignmentModal';
import { Role, User } from '@/component/admin/users/types';
import UserTable from '@/component/admin/users/UserTable';
import { handleAxiosError } from '@/lib/utils/handleAxiosError';
import axios from 'axios';

import { Users } from 'lucide-react'; // Add this import
import { useEffect, useState } from 'react';

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [globalRoles, setGlobalRoles] = useState<Role[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/without-global-roles`, {
          withCredentials: true,
        });
        setUsers(response.data.data);
        setError(null);
      } catch (err:unknown) {
        const errorMessage = handleAxiosError(err, 'Error Fetch users');
        setError(errorMessage);
       
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchGlobalRoles = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/roles/global`,
          { withCredentials: true },
        );
        setGlobalRoles(response.data.data);
       
      } catch (err:unknown) {
        const errorMessage = handleAxiosError(err, 'Error Fetch role');
        setError(errorMessage);
        setGlobalRoles([]);
        
        
      }
    };

    fetchGlobalRoles();
  }, []);

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) return;

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/role-assignments/users/${selectedUser._id}/assignments/global`,
        { roleId: selectedRole },
        { withCredentials: true },
      );

      alert(`Role successfully assigned`);
      setSelectedUser(null);
      setSelectedRole('');
    } catch (err:unknown) {
      const errorMessage = handleAxiosError(err, 'Error assigning role');
     setError(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }



  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Users className="w-6 h-6 mr-2 text-gray-500" />
            Users Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage user accounts and role assignments
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {users.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 text-center">
            <p className="text-gray-500">No users found in the system.</p>
          </div>
        ) : (
          <UserTable
            users={users}
            canAssignRoles={true}
            onAssignClick={setSelectedUser}
          />
        )}
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
