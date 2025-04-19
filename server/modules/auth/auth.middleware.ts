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
  id: string;
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
    const user = await User.findById(decoded.id).select('+password'); // Select password only if needed later (e.g., password change)

    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    req.user = user; // Attach user to request
    next();
  } catch (error) {
    return next(new ErrorResponse('Not authorized, invalid token', 401));
  }
};

async function validateRequiredPermission(permissionName: string): Promise<{
  permissionId: Types.ObjectId;
  scope: PermissionScope;
} | null> {
  const permission = await Permission.findOne({ name: permissionName })
    .select('_id name scope')
    .lean();

  if (!permission) {
    console.warn(`Permission '${permissionName}' not found in database.`);
    return null;
  }

  return {
    permissionId: permission._id as Types.ObjectId,
    scope: permission.scope,
  };
}

function getScopeContext(
  scope: PermissionScope,
  req: AuthRequest,
): Types.ObjectId | null {
  const organizationId =
    req.organizationId || req.params.id || req.params.organizationId;
  const eventId = req.eventId || req.params.eventId;

  if (scope === PermissionScope.ORGANIZATION && organizationId) {
    return new mongoose.Types.ObjectId(organizationId as string);
  }
  if (scope === PermissionScope.EVENT && eventId) {
    return new mongoose.Types.ObjectId(eventId as string);
  }
  return null;
}

async function checkUserPermission(
  userId: Types.ObjectId,
  permissionId: Types.ObjectId,
  scope: PermissionScope,
  contextId?: Types.ObjectId,
): Promise<boolean> {
  const query = {
    userId,
    scope,
    ...(contextId && { scopeId: contextId }),
  };

  const assignments = await UserRoleAssignment.findOne(query).populate<{
    roleId: IRole;
  }>({
    path: 'roleId',
    select: 'permissions',
    populate: {
      path: 'permissions',
      select: '_id',
    },
  });

  if (!assignments?.roleId?.permissions) return false;

  return assignments.roleId.permissions.some((p: { _id: Types.ObjectId }) =>
    p._id.equals(permissionId),
  );
}

// Main middleware with reduced complexity
export const checkPermission = (requiredPermissionName: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new ErrorResponse('User not authenticated', 401));
      }

      const permissionData = await validateRequiredPermission(
        requiredPermissionName,
      );
      if (!permissionData) {
        return next(
          new ErrorResponse(
            `Permission '${requiredPermissionName}' is not configured.`,
            500,
          ),
        );
      }

      const contextId = getScopeContext(permissionData.scope, req);
      if (!contextId && permissionData.scope !== PermissionScope.GLOBAL) {
        return next(
          new ErrorResponse(
            `Context ID required for ${permissionData.scope} scope`,
            400,
          ),
        );
      }

      const hasPermission = await checkUserPermission(
        req.user.id,
        permissionData.permissionId,
        permissionData.scope,
        contextId || undefined,
      );

      if (hasPermission) {
        return next();
      }

      console.log(
        `Authorization denied for user ${req.user.email} - ${requiredPermissionName}`,
      );
      return next(
        new ErrorResponse(
          `Not authorized to perform: ${requiredPermissionName}`,
          403,
        ),
      );
    } catch (error: any) {
      if (error instanceof mongoose.Error.CastError) {
        return next(new ErrorResponse('Invalid ID format provided', 400));
      }
      console.error('Permission check error:', error);
      return next(new ErrorResponse('Authorization check failed', 500));
    }
  };
};
