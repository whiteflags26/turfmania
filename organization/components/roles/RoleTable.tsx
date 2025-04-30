"use client"
import {
  Check,
  ChevronDown,
  Info,
  Search,
  Shield,
  Trash2,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Role } from '@/types/role';

type Props = {
  readonly roles: Role[];
  readonly canDelete: boolean;
  readonly onDelete: (roleId: string) => void;
};

type ScopeClassMap = {
  global: string;
  organization: string;
  local: string;
};

export default function RoleTable({ roles, canDelete, onDelete }: Props) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const handleDelete = (roleId: string) => {
    setDeleteConfirm(null);
    onDelete(roleId);
  };

  const toggleExpandRow = (roleId: string) => {
    setExpandedRow(expandedRow === roleId ? null : roleId);
  };

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (roles.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 text-center">
        <div className="bg-blue-50 rounded-full p-3 w-16 h-16 mx-auto flex items-center justify-center">
          <Shield className="h-8 w-8 text-blue-500" />
        </div>
        <h3 className="mt-4 text-lg font-medium text-gray-900">
          No Roles Found
        </h3>
        <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
          Get started by creating a new role. Roles define what actions users
          can perform in the system.
        </p>
        <button className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          Create New Role
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative rounded-md shadow-sm w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
            placeholder="Search roles"
          />
        </div>
        <div className="text-sm text-gray-500">
          {filteredRoles.length} {filteredRoles.length === 1 ? 'role' : 'roles'}{' '}
          found
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                >
                  Role Name
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >
                  Scope
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >
                  Permissions
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >
                  Default
                </th>
                {canDelete && (
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Actions</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredRoles.map(role => {
                // Extract nested ternary into variable
                let scopeClass = 'bg-green-100 text-green-800'; // Default for 'local'
                if (role.scope === 'global') {
                  scopeClass = 'bg-purple-100 text-purple-800';
                } else if (role.scope === 'organization') {
                  scopeClass = 'bg-blue-100 text-blue-800';
                }

                return (
                  <>
                    <tr
                      key={role._id}
                      className={`${
                        expandedRow === role._id
                          ? 'bg-blue-50'
                          : 'hover:bg-gray-50'
                      } cursor-pointer`}
                      onClick={() => toggleExpandRow(role._id)}
                    >
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                        <div className="flex items-center">
                          <div
                            className={`p-1.5 rounded-full ${
                              role.isDefault ? 'bg-blue-100' : 'bg-gray-100'
                            } mr-3`}
                          >
                            <Shield
                              className={`h-5 w-5 ${
                                role.isDefault
                                  ? 'text-blue-600'
                                  : 'text-gray-500'
                              }`}
                            />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 flex items-center">
                              {role.name}
                              <ChevronDown
                                className={`ml-1 h-4 w-4 transition-transform ${
                                  expandedRow === role._id ? 'rotate-180' : ''
                                }`}
                              />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${scopeClass}`}
                        >
                          {role.scope}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        <div className="flex flex-wrap gap-1.5">
                          {role.permissions.slice(0, 3).map(perm => (
                            <span
                              key={perm._id}
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                              title={perm.description}
                            >
                              {perm.name}
                            </span>
                          ))}
                          {role.permissions.length > 3 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                              +{role.permissions.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        {role.isDefault ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Check className="h-3 w-3 mr-1" />
                            Default
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            <X className="h-3 w-3 mr-1" />
                            No
                          </span>
                        )}
                      </td>
                      {canDelete && (
                        <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          {!role.isDefault && (
                            <>
                              {deleteConfirm === role._id ? (
                                <fieldset className="flex items-center justify-end space-x-2">
                                  <legend className="sr-only">Delete confirmation actions</legend>
                                  <button
                                    onClick={() => handleDelete(role._id)}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter' || e.key === ' ') {
                                        handleDelete(role._id);
                                      }
                                    }}
                                    className="text-white bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirm(null)}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter' || e.key === ' ') {
                                        setDeleteConfirm(null);
                                      }
                                    }}
                                    className="text-gray-700 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                                  >
                                    Cancel
                                  </button>
                                </fieldset>
                              ) : (
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    setDeleteConfirm(role._id);
                                  }}
                                  className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                >
                                  <Trash2 className="h-3 w-3 mr-1 text-gray-400" />
                                  Delete
                                </button>
                              )}
                            </>
                          )}
                        </td>
                      )}
                    </tr>
                    {expandedRow === role._id && (
                      <tr className="bg-blue-50">
                        <td colSpan={canDelete ? 5 : 4} className="px-6 py-4">
                          <div className="mb-3">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">
                              Full Role Details
                            </h4>
                            <div className="text-sm text-gray-600 mb-2"></div>
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">ID:</span>{' '}
                              {role._id}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                              <span>Permissions</span>
                              <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                                {role.permissions.length}
                              </span>
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {role.permissions.map(perm => (
                                <div
                                  key={perm._id}
                                  className="bg-white p-2 rounded border border-gray-200 flex items-start"
                                >
                                  <Info className="h-4 w-4 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {perm.name}
                                    </div>
                                    {perm.description && (
                                      <div className="text-xs text-gray-500">
                                        {perm.description}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}