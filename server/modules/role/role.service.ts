import mongoose, { Types } from 'mongoose';
import ErrorResponse from '../../utils/errorResponse';
import { PermissionScope } from '../permission/permission.model';
import Role, { IRole } from '../role/role.model';
import UserRoleAssignment from '../role_assignment/userRoleAssignment.model';
import User from '../user/user.model';
import Organization from '../organization/organization.model';

interface RoleUpdateData{
    name?:string,
    permission?:string[]|Types.ObjectId[]
}

class RoleService{
      /**
   * Get all roles for an organization
   * @param organizationId - The ID of the organization
   * @returns Promise<IRole[]> - Array of roles
   */

      public async getRolesByOrganization(organizationId: string): Promise<IRole[]> {
        try {
          const orgObjectId = new mongoose.Types.ObjectId(organizationId);
          
          // Verify organization exists
          const organizationExists = await Organization.exists({ _id: orgObjectId });
          if (!organizationExists) {
            throw new ErrorResponse('Organization not found', 404);
          }
          
          const roles = await Role.find({
            scope: PermissionScope.ORGANIZATION,
            scopeId: orgObjectId
          }).populate('permissions', 'name description');
          
          return roles;
        } catch (error: any) {
          console.error('Error fetching organization roles:', error);
          throw new ErrorResponse(error.message || 'Failed to fetch roles', error.statusCode || 500);
        }
      }
}

export const roleService = new RoleService();