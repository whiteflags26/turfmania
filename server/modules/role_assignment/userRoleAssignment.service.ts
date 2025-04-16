import mongoose, { Types } from 'mongoose';
import ErrorResponse from '../../utils/errorResponse';
import Organization from '../organization/organization.model';
import { PermissionScope } from '../permission/permission.model';
import Role from '../role/role.model';
import User from '../user/user.model';
import UserRoleAssignment, {
  IUserRoleAssignment,
} from './userRoleAssignment.model';

class UserRoleAssignmentService {
  public async assignRoleToUser(
    userId: string,
    roleId: string,
    scope: PermissionScope,
    scopeId?: string,
  ): Promise<IUserRoleAssignment> {
    try {
      // Validate IDs
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ErrorResponse('Invalid User ID', 400);
      }
      if (!mongoose.Types.ObjectId.isValid(roleId)) {
        throw new ErrorResponse('Invalid Role ID', 400);
      }

      const userObjectId = new Types.ObjectId(userId);
      const roleObjectId = new Types.ObjectId(roleId);
      let contextObjectId: Types.ObjectId | undefined;

      // Check user exists
      const userExists = await User.exists({ _id: userObjectId });
      if (!userExists) {
        throw new ErrorResponse('User not found', 404);
      }

      // Check role exists and scope matches
      const role = await Role.findById(roleObjectId).lean();
      if (!role) {
        throw new ErrorResponse('Role not found', 404);
      }
      if (role.scope !== scope) {
        throw new ErrorResponse(
          `Role scope mismatch. Expected ${scope}, got ${role.scope}`,
          400,
        );
      }

      // Handle scope-specific validation
      if (
        scope === PermissionScope.ORGANIZATION ||
        scope === PermissionScope.EVENT
      ) {
        if (!scopeId || !mongoose.Types.ObjectId.isValid(scopeId)) {
          throw new ErrorResponse(
            `Valid ${scope} ID (scopeId) is required`,
            400,
          );
        }
        contextObjectId = new Types.ObjectId(scopeId);

        if (scope === PermissionScope.ORGANIZATION) {
          const orgExists = await Organization.exists({ _id: contextObjectId });
          if (!orgExists) {
            throw new ErrorResponse('Organization context not found', 404);
          }
        }
      }

      const assignmentData = {
        userId: userObjectId,
        roleId: roleObjectId,
        scope,
        ...(contextObjectId && { scopeId: contextObjectId }),
      };

      // Use findOneAndUpdate with upsert to handle race conditions
      const assignment = await UserRoleAssignment.findOneAndUpdate(
        {
          userId: userObjectId,
          roleId: roleObjectId,
          scopeId: contextObjectId, // Will be undefined for global scope
        },
        { $setOnInsert: assignmentData },
        { new: true, upsert: true, runValidators: true },
      );

      if (!assignment) {
        throw new ErrorResponse('Failed to create role assignment', 500);
      }

      return assignment;
    } catch (error: any) {
      if (error.code === 11000) {
        throw new ErrorResponse(
          'User already has this role in the specified scope/context.',
          409,
        );
      }
      console.error('Error assigning role:', error);
      throw new ErrorResponse(
        error.message ?? 'Failed to assign role',
        error.statusCode ?? 500,
      );
    }
  }
}

export const userRoleAssignmentService = new UserRoleAssignmentService();
