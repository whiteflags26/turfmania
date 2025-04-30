import mongoose from 'mongoose';
import User, { UserDocument } from '../user.model';
import { userService } from '../user.service';
import ErrorResponse from '../../../utils/errorResponse';
import UserRoleAssignment from '../../role_assignment/userRoleAssignment.model';
import '../../turf-review/turf-review.model';

// Mock UserRoleAssignment model
jest.mock('../../role_assignment/userRoleAssignment.model');

// Mock sendEmail to prevent actual email sending during tests
jest.mock('../../../utils/email', () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
}));

describe('UserService', () => {
  // Silence console.error during tests that expect errors
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    (console.error as jest.Mock).mockRestore();
  });

  // No need for MongoMemoryServer setup as it's already handled in jest.setup.ts
  
  beforeEach(async () => {
    // Make sure collections are cleared between tests
    await User.deleteMany({});
    jest.clearAllMocks();
  });

  describe('getAllUsersAdmin', () => {
    it('should return all users', async () => {
      await User.create({ first_name: 'A', last_name: 'B', email: 'a@b.com', password: 'pass123' });
      const users = await userService.getAllUsersAdmin();
      expect(users.length).toBe(1);
      expect(users[0].email).toBe('a@b.com');
    });

    it('should throw ErrorResponse on error', async () => {
      jest.spyOn(User, 'find').mockImplementationOnce(() => { throw new Error('DB error'); });
      await expect(userService.getAllUsersAdmin()).rejects.toThrow(ErrorResponse);
    });
  });

  describe('getUserByIdAdmin', () => {
    it('should return user by id', async () => {
      const user = await User.create({ first_name: 'A', last_name: 'B', email: 'b@b.com', password: 'pass123' });
      const found = await userService.getUserByIdAdmin(user._id.toString());
      expect(found.email).toBe('b@b.com');
    });

    it('should throw 404 if not found', async () => {
      await expect(userService.getUserByIdAdmin(new mongoose.Types.ObjectId().toString()))
        .rejects.toThrow('User not found');
    });

    it('should throw ErrorResponse on error', async () => {
      jest.spyOn(User, 'findById').mockImplementationOnce(() => { throw new Error('DB error'); });
      await expect(userService.getUserByIdAdmin(new mongoose.Types.ObjectId().toString()))
        .rejects.toThrow(ErrorResponse);
    });
  });

  describe('getCurrentUserProfile', () => {
    it('should return user profile', async () => {
      const user = await User.create({ first_name: 'C', last_name: 'D', email: 'c@d.com', password: 'pass123', isVerified: true });
      const found = await userService.getCurrentUserProfile(user._id.toString());
      expect(found.email).toBe('c@d.com');
    });

    it('should throw 404 if not found', async () => {
      await expect(userService.getCurrentUserProfile(new mongoose.Types.ObjectId().toString()))
        .rejects.toThrow('User not found');
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile', async () => {
      const user = await User.create({ first_name: 'E', last_name: 'F', email: 'e@f.com', password: 'pass123' });
      const updated = await userService.updateUserProfile(user._id.toString(), { first_name: 'Z' });
      expect(updated.first_name).toBe('Z');
    });

    it('should remove phone_number if set to empty', async () => {
      const user = await User.create({ first_name: 'G', last_name: 'H', email: 'g@h.com', password: 'pass123', phone_number: '01712345678' });
      const updated = await userService.updateUserProfile(user._id.toString(), { phone_number: '' });
      expect(updated.phone_number).toBeFalsy();
    });

    it('should throw 404 if not found', async () => {
      await expect(userService.updateUserProfile(new mongoose.Types.ObjectId().toString(), { first_name: 'X' }))
        .rejects.toThrow('User not found');
    });

    it('should throw ErrorResponse on error', async () => {
      jest.spyOn(User, 'findByIdAndUpdate').mockImplementationOnce(() => { throw new Error('DB error'); });
      await expect(userService.updateUserProfile(new mongoose.Types.ObjectId().toString(), { first_name: 'X' }))
        .rejects.toThrow(ErrorResponse);
    });
  });

  describe('changeUserPassword', () => {
    it('should change password if current password matches', async () => {
      const user = await User.create({ first_name: 'I', last_name: 'J', email: 'i@j.com', password: 'oldpass123' });
      const result = await userService.changeUserPassword(user._id.toString(), 'oldpass123', 'newpass123');
      expect(result.success).toBe(true);
    });

    it('should throw if user not found', async () => {
      await expect(userService.changeUserPassword(new mongoose.Types.ObjectId().toString(), 'x', 'y'))
        .rejects.toThrow('User not found');
    });

    it('should throw if current password is wrong', async () => {
      const user = await User.create({ first_name: 'K', last_name: 'L', email: 'k@l.com', password: 'rightpass123' });
      await expect(userService.changeUserPassword(user._id.toString(), 'wrongpass', 'newpass123'))
        .rejects.toThrow('Current password is incorrect');
    });
  });

  describe('getUserOrganizations', () => {
    it('should return organizations for user', async () => {
      (UserRoleAssignment.find as any).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValueOnce([
          { scopeId: { _id: 'org1', name: 'Org1' } },
          { scopeId: { _id: 'org2', name: 'Org2' } },
        ]),
      });
      const orgs = await userService.getUserOrganizations(new mongoose.Types.ObjectId().toString());
      expect(orgs.length).toBe(2);
      expect(orgs[0].name).toBe('Org1');
    });

    it('should throw ErrorResponse on error', async () => {
      (UserRoleAssignment.find as any).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockRejectedValueOnce(new Error('DB error')),
      });
      await expect(userService.getUserOrganizations(new mongoose.Types.ObjectId().toString())).rejects.toThrow(ErrorResponse);
    });
  });

  describe('hasOrganizationRole', () => {
    it('should return true if user has role', async () => {
      (UserRoleAssignment.findOne as any).mockResolvedValueOnce({ _id: 'role' });
      const userId = new mongoose.Types.ObjectId().toString();
      const orgId = new mongoose.Types.ObjectId().toString();
      const result = await userService.hasOrganizationRole(userId, orgId);
      expect(result).toBe(true);
    });

    it('should return false if user does not have role', async () => {
      (UserRoleAssignment.findOne as any).mockResolvedValueOnce(null);
      const userId = new mongoose.Types.ObjectId().toString();
      const orgId = new mongoose.Types.ObjectId().toString();
      const result = await userService.hasOrganizationRole(userId, orgId);
      expect(result).toBe(false);
    });

    it('should throw ErrorResponse on error', async () => {
      (UserRoleAssignment.findOne as any).mockImplementationOnce(() => { throw new Error('DB error'); });
      const userId = new mongoose.Types.ObjectId().toString();
      const orgId = new mongoose.Types.ObjectId().toString();
      await expect(userService.hasOrganizationRole(userId, orgId)).rejects.toThrow(ErrorResponse);
    });
  });
  
  // Add tests for getUsersWithoutGlobalRoles
  describe('getUsersWithoutGlobalRoles', () => {
    it('should return users without global roles', async () => {
      await User.create({ first_name: 'No', last_name: 'Role', email: 'no@role.com', password: 'pass123' });
      
      // Mock UserRoleAssignment.distinct to return empty array (no users with global roles)
      (UserRoleAssignment.distinct as any).mockResolvedValueOnce([]);
      
      const users = await userService.getUsersWithoutGlobalRoles();
      expect(users.length).toBeGreaterThan(0);
      expect(users[0].email).toBe('no@role.com');
    });
    
    it('should not return users with global roles', async () => {
      const userWithRole = await User.create({ 
        first_name: 'Has', last_name: 'Role', email: 'has@role.com', password: 'pass123' 
      });
      await User.create({ 
        first_name: 'No', last_name: 'Role', email: 'no@role.com', password: 'pass123' 
      });
      
      // Mock UserRoleAssignment.distinct to return the user with role
      (UserRoleAssignment.distinct as any).mockResolvedValueOnce([userWithRole._id]);
      
      const users = await userService.getUsersWithoutGlobalRoles();
      expect(users.length).toBe(1);
      expect(users[0].email).toBe('no@role.com');
    });
    
    it('should throw ErrorResponse on error', async () => {
      (UserRoleAssignment.distinct as any).mockImplementationOnce(() => { throw new Error('DB error'); });
      await expect(userService.getUsersWithoutGlobalRoles()).rejects.toThrow(ErrorResponse);
    });
  });
});