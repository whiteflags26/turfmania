import { Building2, Info, Shield } from 'lucide-react';
import { Permission } from './types';

interface CreateRoleModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSubmit: () => void;
  readonly permissions: readonly Permission[];
  readonly selectedPermissions: readonly string[];
  readonly togglePermission: (id: string) => void;
  readonly name: string;
  readonly setName: (name: string) => void;
  readonly isDefault: boolean;
  readonly setIsDefault: (isDefault: boolean) => void;
  readonly loading?: boolean;
  readonly error?: string | null;
}

export default function CreateRoleModal({
  isOpen,
  onClose,
  onSubmit,
  permissions,
  selectedPermissions,
  togglePermission,
  name,
  setName,
  isDefault,
  setIsDefault,
  loading = false,
  error = null,
}: Readonly<CreateRoleModalProps>) {
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const inputClasses =
    'mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-900';

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Create New Role
          </h3>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Role Basic Info */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h4 className="text-sm font-medium text-gray-900 flex items-center">
                  <Building2 className="w-4 h-4 mr-2" />
                  Role Information
                </h4>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Role Name*
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className={inputClasses}
                      placeholder="Enter role name"
                      required
                    />
                  </div>
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="isDefault"
                        type="checkbox"
                        checked={isDefault}
                        onChange={e => setIsDefault(e.target.checked)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                    <div className="ml-3">
                      <label
                        htmlFor="isDefault"
                        className="text-sm font-medium text-gray-700"
                      >
                        Default Role
                      </label>
                      <p className="text-xs text-gray-500">
                        This role will be automatically assigned to new users
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Permissions Section */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h4 className="text-sm font-medium text-gray-900 flex items-center">
                  <Shield className="w-4 h-4 mr-2" />
                  Permissions
                </h4>
              </div>
              <div className="p-6">
                <div className="max-h-60 overflow-y-auto space-y-3">
                  {permissions.map(permission => (
                    <div key={permission._id} className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id={`permission-${permission._id}`}
                          type="checkbox"
                          checked={selectedPermissions.includes(permission._id)}
                          onChange={() => togglePermission(permission._id)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>
                      <div className="ml-3">
                        <label
                          htmlFor={`permission-${permission._id}`}
                          className="text-sm font-medium text-gray-700"
                        >
                          {permission.name}
                        </label>
                        {permission.description && (
                          <p className="text-xs text-gray-500">
                            {permission.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Guidelines */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
              <div className="flex">
                <Info className="h-5 w-5 text-blue-400 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800 mb-1">
                    Role Creation Guidelines
                  </h4>
                  <ul className="text-sm text-blue-700 space-y-1 list-disc pl-5">
                    <li>Choose a clear, descriptive name for the role</li>
                    <li>
                      Select appropriate permissions based on user
                      responsibilities
                    </li>
                    <li>
                      Default roles are automatically assigned to new users
                    </li>
                    <li>Permissions cannot be modified after role creation</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name || selectedPermissions.length === 0}
              className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                loading || !name || selectedPermissions.length === 0
                  ? 'bg-blue-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? (
                <div className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creating...
                </div>
              ) : (
                'Create Role'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
