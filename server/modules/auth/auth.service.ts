import { PermissionScope } from './../permission/permission.model';
import User,{ UserDocument } from './../user/user.model';
import { IRole } from './../role/role.model';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import { Types } from 'mongoose';
import { sendEmail } from '../../utils/email';
import ErrorResponse from '../../utils/errorResponse';
import Token from '../token/token.model';

import UserRoleAssignment from '../role_assignment/userRoleAssignment.model';

class AuthService {
  private readonly JWT_SECRET: string;

  constructor() {
    if (!process.env.JWT_SECRET || !process.env.JWT_EXPIRE) {
      throw new Error('JWT configuration is missing');
    }
    this.JWT_SECRET = process.env.JWT_SECRET;
  }

  /** @desc generate token for user **/

  public generateToken(user: UserDocument): string {
    const signOptions: SignOptions = {
      expiresIn: '30d',
    };
    return jwt.sign(
      {
        id: user._id,
      },
      this.JWT_SECRET,
      signOptions,
    );
  }

  /** @desc match user entered password to hash password in database **/

  public async matchPassword(enteredPassword: string, user: UserDocument) {
    return await bcrypt.compare(enteredPassword, user.password);
  }

  /** @desc Generate verification token and send verification email **/

  public async sendVerificationEmail(user: UserDocument) {
    // Generate verification token
    const verificationToken = crypto.randomBytes(20).toString('hex');
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await user.save();

    // Send verification email
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}&id=${user._id}`;
    await sendEmail(
      user.email,
      'Verify Your Email',
      `Click the link to verify your email:\n\n${verificationUrl}\n\nThis link is valid for 24 hours.`,
    );
  }

  /** @desc Password reset email sender **/

  public async sendPasswordResetEmail(user: UserDocument) {
    //generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    const salt = 10;
    const hashedToken = await bcrypt.hash(resetToken, Number(salt));

    //save token in database
    await Token.create({ userId: user._id, token: hashedToken });

    //create reset url
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/?token=${resetToken}&id=${user._id}`;

    // Send reset email
    return await sendEmail(
      user.email,
      'Password Reset Request',
      `Click the link to reset your password:\n\n${resetUrl}\n\nThis link is valid for 10 minutes.`,
    );
  }

  /** @desc Check if user has admin dashboard access **/
  public async checkAdminAccess(userId: Types.ObjectId): Promise<boolean> {
    const assignments = await UserRoleAssignment.findOne({
      userId,
      scope: PermissionScope.GLOBAL,
    }).populate<{
      roleId: IRole;
    }>({
      path: 'roleId',
      select: 'permissions',
      populate: {
        path: 'permissions',
        select: '_id name',
      },
    });

    if (!assignments?.roleId?.permissions) return false;

    return assignments.roleId.permissions.some(
      (p: any) => p.name === 'access_admin_dashboard',
    );
  }
}

/** @desc matches hashed token and saves new password **/

export const resetUserPassword = async (
  id: string,
  token: string,
  newPassword: string,
) => {
  // Check if token exists in DB
  const tokenRecord = await Token.findOne({ userId: id });
  if (!tokenRecord) {
    throw new ErrorResponse('Invalid or expired token', 400);
  }

  // Compare provided token with hashed token in DB
  const isMatch = await bcrypt.compare(token, tokenRecord.token);
  if (!isMatch) {
    throw new ErrorResponse('Invalid or expired token', 400);
  }

  // Find user by ID
  const user = await User.findById(id);
  if (!user) {
    throw new ErrorResponse('User not found', 404);
  }

  // Update user password
  user.password = newPassword;
  await user.save();

  // Delete used token from DB
  await Token.findByIdAndDelete(tokenRecord._id);

  // Send success email
  await sendEmail(
    user.email,
    'Password Reset Successful',
    'Your password has been successfully reset. If you did not perform this action, please contact support immediately.',
  );

  return { success: true, message: 'Password reset successful!' };
};

export const authService = new AuthService();
export default authService;
