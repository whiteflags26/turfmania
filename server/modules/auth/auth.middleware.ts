import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../../modules/user/user.model';
import ErrorResponse from '../../utils/errorResponse';

interface JwtPayload {
  id: string;
  role: string[];
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    user_roles: string[];
    _id: string;
  };
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
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // If no token is found, deny access
  if (!token) {
    return next(new ErrorResponse('Not authorized, no token found', 401));
  }

  try {
    // Verify token
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    console.log(decoded.id)

    // Fetch user and attach to request object excluding password
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    req.user = {
      id: decoded.id,
      user_roles:decoded.role
    }; // Attach user to request
    next();
  } catch (error) {
    return next(new ErrorResponse('Not authorized, invalid token', 401));
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.user_roles) {
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

