'use client';

import RoleAssignmentModal from '@/components/RoleAssignmentModal';
import { Role, User } from '@/types/role';
import UserTable from '@/components/UserTable'
import api from '@/lib/axios';
import { Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [globalRoles, setGlobalRoles] = useState<Role[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assigningRole, setAssigningRole] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/v1/users/without-global-roles');
        setUsers(response.data.data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch users:', err);
        setError('Failed to load users. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchGlobalRoles = async () => {
      try {
        const response = await api.get('/api/v1/roles/global');
        setGlobalRoles(response.data.data);
      } catch (err) {
        console.error('Failed to fetch roles:', err);
        setGlobalRoles([]);
      }
    };

    fetchGlobalRoles();
  }, []);

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) {
      toast.error('Please select both user and role');
      return;
    }

    try {
      setAssigningRole(true);
      await api.post(
        `/api/v1/role-assignments/users/${selectedUser._id}/assignments/global`,
        { roleId: selectedRole }
      );
      
      // Remove assigned user from the list
      setUsers(prev => prev.filter(user => user._id !== selectedUser._id));
      
      toast.success(`Role successfully assigned to ${selectedUser.first_name}`);
      setSelectedUser(null);
      setSelectedRole('');
    } catch (err) {
      console.error('Error assigning role:', err);
      toast.error('Failed to assign role. Please try again.');
    } finally {
      setAssigningRole(false);
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
          <h2 className="text-xl font-semibold text-red-700 mb-2">Error</h2>
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
            assigningUser={assigningRole ? selectedUser?._id : undefined}
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
