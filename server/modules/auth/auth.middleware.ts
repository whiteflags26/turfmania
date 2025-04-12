import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import ErrorResponse from '../../utils/errorResponse';
import Organization from '../organization/organization.model';
import Role from '../role/role.model';
import Permission, { PermissionScope } from '../permission/permission.model';
import User from '../../modules/user/user.model';
import mongoose from 'mongoose';
import { UserDocument } from '../user/user.model';
interface JwtPayload {
 id:String
 
}

export interface AuthRequest extends Request {
  user?:UserDocument; // Attach the full Mongoose user document
    // Add properties to hold context IDs if needed during the request lifecycle
    organizationId?: string | mongoose.Types.ObjectId;
    eventId?: string | mongoose.Types.ObjectId;
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
  else if (
  req.headers.authorization?.startsWith('Bearer'))
   {
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
    .populate({
        path: 'globalRoles',
        populate: { path: 'permissions', select: 'name scope' } // Populate permissions within roles
    })
    .populate({
        path: 'organizationRoles.role',
        populate: { path: 'permissions', select: 'name scope' }
    })
    .populate({
        path: 'eventRoles.role',
        populate: { path: 'permissions', select: 'name scope' }
    })
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

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.user_roles) {
      return next(new ErrorResponse('User role is not defined', 403));
    }

    const isAuthorized = req.user.user_roles.some(userRole =>
      roles.includes(userRole),
    );

    if (!isAuthorized) {
      return next(
        new ErrorResponse(
          `User role ${req.user.user_roles.join(
            ', ',
          )} is not authorized to access this route`,
          403,
        ),
      );
    }

    next();
  };
};

export const checkPermission = (requiredPermissionName: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ErrorResponse('User not authenticated', 401));
    }

    try {
        
        const requiredPermission = await Permission.findOne({ name: requiredPermissionName }).lean(); // Use lean for plain JS object
        if (!requiredPermission) {
             console.warn(`Permission check failed: Permission '${requiredPermissionName}' not found in database.`);
             return next(new ErrorResponse(`Permission '${requiredPermissionName}' is not configured.`, 500));
        }

        const userId = req.user._id;
        let hasPermission = false;

        
        const scopeToCheck = requiredPermission.scope;
        const organizationId = req.organizationId || req.params.id || req.params.organizationId; // Get org ID from request context
        const eventId = req.eventId || req.params.eventId; // Get event ID

       
        if (scopeToCheck === PermissionScope.GLOBAL) {
            for (const role of req.user.globalRoles as any[]) { // Cast to any[] if population structure is complex
                if (role.permissions && role.permissions.some((p: any) => p.name === requiredPermissionName)) {
                    hasPermission = true;
                    break;
                }
            }
        }

       
        if (!hasPermission && scopeToCheck === PermissionScope.ORGANIZATION) {
            if (!organizationId) {
                console.warn(`Permission check failed: Organization context required for permission '${requiredPermissionName}' but no organization ID found in request params (id or organizationId).`);
                return next(new ErrorResponse(`Organization context required for this action.`, 400));
            }
            for (const orgRoleAssignment of req.user.organizationRoles) {
                 
                 if (orgRoleAssignment.organizationId.equals(organizationId)) {
                     const role: any = orgRoleAssignment.role; // Role should be populated
                     if (role && role.permissions && role.permissions.some((p: any) => p.name === requiredPermissionName)) {
                        hasPermission = true;
                        break;
                    }
                 }
            }
        }

        
        if (!hasPermission && scopeToCheck === PermissionScope.EVENT) {
             if (!eventId) {
                console.warn(`Permission check failed: Event context required for permission '${requiredPermissionName}' but no event ID found in request params (eventId).`);
                return next(new ErrorResponse(`Event context required for this action.`, 400));
            }
             for (const eventRoleAssignment of req.user.eventRoles) {
                 if (eventRoleAssignment.eventId.equals(eventId)) {
                     const role: any = eventRoleAssignment.role; // Role should be populated
                     if (role && role.permissions && role.permissions.some((p: any) => p.name === requiredPermissionName)) {
                        hasPermission = true;
                        break;
                    }
                 }
            }
        }


        // 4. Final Decision
        if (hasPermission) {
            next(); // User has the permission
        } else {
            console.log(`Authorization denied for user ${req.user.email} attempting action '${requiredPermissionName}' on scope '${scopeToCheck}' (Context IDs: Org=${organizationId}, Event=${eventId})`);
            return next(new ErrorResponse(`User is not authorized to perform action: ${requiredPermissionName}`, 403));
        }

    } catch (error) {
      console.error('Error during permission check:', error);
      next(new ErrorResponse('Server error during authorization check', 500));
    }
  };
};
