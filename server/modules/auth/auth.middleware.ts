import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import UserRoleAssignment from '../role_assignment/userRoleAssignment.model';
import { IPermission, PermissionScope } from './../permission/permission.model';

import mongoose, { Types } from 'mongoose';
import User from '../../modules/user/user.model';
import ErrorResponse from '../../utils/errorResponse';
import Permission from '../permission/permission.model';
import { IRole } from '../role/role.model';
import { UserDocument } from '../user/user.model';

interface JwtPayload {
  id: String;
}

export interface AuthRequest extends Request {
  user?: UserDocument; // Attach the full Mongoose user document
  // Add properties to hold context IDs if needed during the request lifecycle
  organizationId?: string | mongoose.Types.ObjectId;
  eventId?: string | mongoose.Types.ObjectId;
}

// Update the interface to extend IPermission
interface IPermissionDocument extends IPermission {
  _id: Types.ObjectId;
  name: string;
  scope: PermissionScope;
  __v?: number;
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  let token;

  // Get token from cookies
  if (req.cookies.token) {
    token = req.cookies.token;
  }

  // Check Authorization header as fallback
  else if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // If no token is found, deny access
  if (!token) {
    return next(new ErrorResponse('Not authorized, no token found', 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    // Fetch user and attach to request object excluding password
    const user = await User.findById(decoded.id)
      .select('+password'); // Select password only if needed later (e.g., password change)

    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    req.user = user; // Attach user to request
    next();
  } catch (error) {
    return next(new ErrorResponse('Not authorized, invalid token', 401));
  }
};

export const checkPermission = (requiredPermissionName: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ErrorResponse('User not authenticated', 401));
    }

    try {
      // 1. Find the required permission details with proper typing
      const requiredPermission = await Permission.findOne({
        name: requiredPermissionName,
      })
        .select('_id name scope')
        .lean();

      if (!requiredPermission) {
        console.warn(
          `Permission check failed: Permission '${requiredPermissionName}' not found in database.`,
        );
        return next(
          new ErrorResponse(
            `Permission '${requiredPermissionName}' is not configured.`,
            500,
          ),
        );
      }

      const userId = req.user._id;
      const requiredScope = requiredPermission.scope;
      // Convert the _id to ObjectId explicitly
      const requiredPermissionId = new Types.ObjectId(
        requiredPermission._id.toString(),
      );

      // 2. Determine Context ID based on scope
      let contextScopeId: Types.ObjectId | string | null | undefined = null;
      const organizationId =
        req.organizationId || req.params.id || req.params.organizationId;
      const eventId = req.eventId || req.params.eventId;

      if (requiredScope === PermissionScope.ORGANIZATION) {
        if (!organizationId) {
          return next(
            new ErrorResponse(`Organization not found`, 400),
          );
        }
        contextScopeId = new mongoose.Types.ObjectId(organizationId as string);
      } else if (requiredScope === PermissionScope.EVENT) {
        if (!eventId) {
          return next(
            new ErrorResponse(`Event not found`, 400),
          );

          
        }
        contextScopeId = new mongoose.Types.ObjectId(eventId as string);
      }

      // 3. Find relevant role assignments
      const query: any = { userId: userId, scope: requiredScope };
      if (contextScopeId) {
        query.scopeId = contextScopeId;
      } else if (requiredScope !== PermissionScope.GLOBAL) {
        console.error(
          `Scope ID missing for non-global permission check. Scope: ${requiredScope}`,
        );
        return next(
          new ErrorResponse(`Context ID error during permission check.`, 500),
        );
      }

      const assignments = await UserRoleAssignment.find(query).populate<{
        roleId: IRole;
      }>({
        // Type the populated field
        path: 'roleId',
        select: 'permissions', // Select permissions array from Role
        populate: {
          // Populate items WITHIN the permissions array
          path: 'permissions',
          select: '_id', // Select ONLY _id from each Permission doc
        },
      });

      // 4. Check if any assigned role has the required permission
      let hasPermission = false;
      for (const assignment of assignments) {
        // Check roleId and its permissions array exist after population
        if (
          assignment.roleId?.permissions &&
          Array.isArray(assignment.roleId.permissions)
        ) {
          // FIX 2: Explicitly type the parameter 'p'
          if (
            assignment.roleId.permissions.some((p: { _id: Types.ObjectId }) =>
              p._id.equals(requiredPermissionId),
            )
          ) {
            hasPermission = true;
            break;
          }
        }
      }

      // 5. Final Decision
      if (hasPermission) {
        next();
      } else {
        console.log(
          `Authorization denied for user ${
            req.user.email
          } attempting action '${requiredPermissionName}' on scope '${requiredScope}' (Context ID: ${
            contextScopeId || 'N/A'
          })`,
        );
        return next(
          new ErrorResponse(
            `User is not authorized to perform action: ${requiredPermissionName}`,
            403,
          ),
        );
      }
    } catch (error: any) {
      // ... (error handling remains same) ...
      if (error instanceof mongoose.Error.CastError) {
        console.error(
          'Error casting context ID during permission check:',
          error,
        );
        return next(
          new ErrorResponse('Invalid ID format provided for context.', 400),
        );
      }
      console.error('Error during permission check:', error);
      next(new ErrorResponse('Server error during authorization check', 500));
    }
  };
};
