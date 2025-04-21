import mongoose from 'mongoose';
import ErrorResponse from '../../utils/errorResponse';
import User, { UserDocument } from './user.model';

class UserService {
  /**
   * Get all users
   * @returns Promise<UserDocument[]> - Array of users
   */
  public async getAllUsers(): Promise<UserDocument[]> {
    try {
      const users = await User.find().select({
        password: 0,
        
      })
      
      return users;
    } catch (error: any) {
      console.error('Error fetching users:', error);
      throw new ErrorResponse(
        error.message ?? 'Failed to fetch users',
        error.statusCode ?? 500
      );
    }
  }

  /**
   * Get user by ID
   * @param userId - The ID of the user
   * @returns Promise<UserDocument> - User document
   */
  public async getUserById(userId: string): Promise<UserDocument> {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ErrorResponse('Invalid User ID', 400);
      }

      const user = await User.findById(userId).select({
        password: 0,
        verificationToken: 0,
        verificationTokenExpires: 0
      });
      
      if (!user) {
        throw new ErrorResponse('User not found', 404);
      }
      
      return user;
    } catch (error: any) {
      console.error('Error fetching user:', error);
      throw new ErrorResponse(
        error.message ?? 'Failed to fetch user',
        error.statusCode ?? 500
      );
    }
  }
}

export const userService = new UserService();