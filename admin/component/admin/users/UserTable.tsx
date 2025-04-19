import { User } from './types';
import React from 'react';

interface Props {
  users: User[];
  canAssignRoles: boolean;
  onAssignClick: (user: User) => void;
}

const UserTable: React.FC<Props> = ({ users, canAssignRoles, onAssignClick }) => {
  return (
    <table className="min-w-full divide-y divide-gray-300">
      <thead className="bg-gray-50">
        <tr>
          <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Name</th>
          <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Email</th>
          <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Created At</th>
          <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
            <span className="sr-only">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 bg-white">
        {users.map((user) => (
          <tr key={user._id}>
            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
              {user.name}
            </td>
            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{user.email}</td>
            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
              {new Date(user.createdAt).toLocaleDateString()}
            </td>
            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
              {canAssignRoles && (
                <button
                  onClick={() => onAssignClick(user)}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  Assign Role
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default UserTable;