'use client';

import RoleAssignmentModal from '@/component/admin/users/RoleAssignmentModal';
import { Role, User } from '@/component/admin/users/types';
import UserTable from '@/component/admin/users/UserTable';
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
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/admin`, {
          withCredentials: true,
        });
        setUsers(response.data.data);
        setError(null);
      } catch (err:unknown) {
        console.error('Error fetching users:', err);
        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.message || 'An error occurred while fetching users');
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
        setError( 'An error occurred while fetching users');
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
          'http://localhost:5000/api/v1/roles/global',
          { withCredentials: true },
        );
        setGlobalRoles(response.data.data);
      } catch (err:unknown) {
        if (axios.isAxiosError(err)) {
          console.error('Error fetching global roles:', err.response?.data?.message);
        }
        else if (err instanceof Error) {
          console.error('Error fetching global roles:', err.message);
        } else {
          console.error('Error fetching global roles:', 'An unknown error occurred');
        }
        console.error('Error fetching global roles:', err);
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
      if (axios.isAxiosError(err)) {
        console.error('Error assigning role:', err.response?.data?.message);
        alert(`Failed to assign role: ${err.response?.data?.message}`);
      } else if (err instanceof Error) {
        console.error('Error assigning role:', err.message);
        alert(`Failed to assign role: ${err.message}`);
      } else {
        console.error('Error assigning role:', 'An unknown error occurred');
        alert('Failed to assign role. Please try again.');
      }
      console.error('Error assigning role:', err);
      alert('Failed to assign role. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-700 mb-2">
            {error}
          </h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Retry
          </button>
        </div>
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
