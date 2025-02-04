import { NextFunction, Request, Response } from 'express';
import asyncHandler from '../../shared/middleware/async';
import ErrorResponse from '../../utils/errorResponce';
import { isValidEmail } from '../../utils/validation'; // You'll need to create this
import User, { UserDocument } from '../user/user.model';
import authService from './auth.service';

interface RegisterBody {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role?: string;
}

interface LoginBody {
  email: string;
  password: string;
}

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
export const register = asyncHandler(
  async (
    req: Request<{}, {}, RegisterBody>,
    res: Response,
    next: NextFunction,
  ) => {
    const { first_name, last_name, email, password, role } = req.body;

    // Input validation
    if (
      !first_name?.trim() ||
      !last_name?.trim() ||
      !email?.trim() ||
      !password?.trim()
    ) {
      return next(new ErrorResponse('All fields are required', 400));
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return next(new ErrorResponse('Invalid email format', 400));
    }

    // Validate role (whitelist approach)

    // Check if user already exists (case insensitive)
    const existingUser = await User.findOne({
      email: new RegExp(`^${email.trim()}$`, 'i'),
    });

    if (existingUser) {
      return next(new ErrorResponse('Email already registered', 400));
    }

    // Create user with sanitized inputs
    const user: UserDocument = await User.create({
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: email.trim().toLowerCase(),
      password, // Password will be hashed by the model's pre-save hook
      role: role || 'user',
    });

    const token = await authService.generateToken(user);

    // Remove sensitive data from response
    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;

    res.status(201).json({
      success: true,
      data: { user: userWithoutPassword, token },
    });
  },
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login a user
 * @access  Public
 */
export const login = asyncHandler(
  async (
    req: Request<{}, {}, LoginBody>,
    res: Response,
    next: NextFunction,
  ) => {
    const { email, password } = req.body;

    // Input validation
    if (!email?.trim() || !password?.trim()) {
      return next(
        new ErrorResponse('Please provide an email and password', 400),
      );
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return next(new ErrorResponse('Invalid email format', 400));
    }

    // Find user with case-insensitive email match
    const user = await User.findOne({
      email: new RegExp(`^${email.trim()}$`, 'i'),
    }).select('+password');

    if (!user) {
      // Use consistent error message for security
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Check password
    const isMatched = await authService.matchPassword(password, user);

    if (!isMatched) {
      // Use consistent error message for security
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Generate token
    const token = await authService.generateToken(user);

    // Remove sensitive data from response
    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;

    res.status(200).json({
      success: true,
      data: { user: userWithoutPassword, token },
    });
  },
);
