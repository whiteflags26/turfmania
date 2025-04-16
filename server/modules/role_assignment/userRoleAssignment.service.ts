import mongoose, { Types } from "mongoose";
import ErrorResponse from "../../utils/errorResponse";
import User from "../user/user.model";
import Role from "../role/role.model";
import UserRoleAssignment ,{IUserRoleAssignment}from "./userRoleAssignment.model";
import { PermissionScope } from "../permission/permission.model";
import Organization from "../organization/organization.model";


class UserRoleAssignmentService{
    async assignROleTOUser(
        userId:string,
        roleId:string,
        scope:PermissionScope,
        scopeId?:string,
    ):Promise<IUserRoleAssignment>{
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new ErrorResponse('Invalid User ID', 400);
         }
         if (!mongoose.Types.ObjectId.isValid(roleId)) {
             throw new ErrorResponse('Invalid Role ID', 400);

         }
         const userObjectId = new Types.ObjectId(userId);
         const roleObjectId = new Types.ObjectId(roleId);
         let contextObjectId: Types.ObjectId | undefined = undefined;
         const userExists = await User.exists({ _id: userObjectId });
         if (!userExists) {
             throw new ErrorResponse('User not found', 404);
         }
         const role = await Role.findById(roleObjectId).lean();
         if (!role) {
             throw new ErrorResponse('Role not found', 404);
         }
         if (role.scope !== scope) {
             throw new ErrorResponse(`Role scope mismatch. Expected ${scope}, got ${role.scope}`, 400);
         }

         if (scope === PermissionScope.ORGANIZATION || scope === PermissionScope.EVENT) {
            if (!scopeId || !mongoose.Types.ObjectId.isValid(scopeId)) {
                throw new ErrorResponse(`Valid ${scope} ID (scopeId) is required`, 400);
            }
            contextObjectId = new Types.ObjectId(scopeId);
            if (scope === PermissionScope.ORGANIZATION) {
                const orgExists = await Organization.exists({ _id: contextObjectId });
                if (!orgExists) throw new ErrorResponse('Organization context not found', 404);
            }
    } else if (scope === PermissionScope.GLOBAL) {
        if (scopeId) {
           console.warn("scopeId provided for a GLOBAL assignment. It will be ignored.");
          
        }
    } else {
         throw new ErrorResponse('Invalid scope provided for assignment', 400); // Should be caught by enum check usually
    }
    try {
        const assignmentData: Partial<IUserRoleAssignment> = {
            userId: userObjectId,
            roleId: roleObjectId,
            scope: scope,
        };
        if (contextObjectId) {
            assignmentData.scopeId = contextObjectId;
        }

        // Use findOneAndUpdate with upsert:true to handle potential race conditions
        // and rely on the unique index ({ userId: 1, roleId: 1, scopeId: 1 })
        const assignment = await UserRoleAssignment.findOneAndUpdate(
            {
               userId: userObjectId,
               roleId: roleObjectId,
               scopeId: contextObjectId // Mongoose handles null correctly here for global
            },
            { $setOnInsert: assignmentData }, // Only set fields on insert
            { new: true, upsert: true, runValidators: true }
        );

       

        return assignment;

    } catch (error: any) {
       
        if (error.code === 11000) {
             throw new ErrorResponse('User already has this role in the specified scope/context.', 409);
        }
        console.error("Error assigning role:", error);
        throw new ErrorResponse(error.message ?? 'Failed to assign role', 500);
    }
  }



}

export const userRoleAssignmentService = new UserRoleAssignmentService();
