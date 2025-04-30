import { permissionService } from '../permission.service';
import Permission, { PermissionScope } from '../permission.model';
import ErrorResponse from '../../../utils/errorResponse';

jest.mock('../permission.model');

describe('PermissionService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllPermissions', () => {
    it('should return all permissions', async () => {
      const mockPermissions = [
        { name: 'perm1', description: 'desc1', scope: PermissionScope.GLOBAL },
        { name: 'perm2', description: 'desc2', scope: PermissionScope.ORGANIZATION }
      ];
      (Permission.find as any).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValueOnce(mockPermissions)
      });

      const result = await permissionService.getAllPermissions();
      expect(result).toEqual(mockPermissions);
      expect(Permission.find).toHaveBeenCalled();
    });

    it('should throw ErrorResponse on error', async () => {
      (Permission.find as any).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockRejectedValueOnce(new Error('DB error'))
      });

      await expect(permissionService.getAllPermissions())
        .rejects
        .toThrow(new ErrorResponse('DB error', 500));
    });
  });

  describe('getPermissionsByScope', () => {
    it('should return permissions by scope', async () => {
      const mockPermissions = [
        { name: 'perm1', description: 'desc1', scope: PermissionScope.GLOBAL }
      ];
      (Permission.find as any).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValueOnce(mockPermissions)
      });

      const result = await permissionService.getPermissionsByScope(PermissionScope.GLOBAL);
      expect(result).toEqual(mockPermissions);
      expect(Permission.find).toHaveBeenCalledWith({ scope: PermissionScope.GLOBAL });
    });

    it('should throw ErrorResponse on error', async () => {
      (Permission.find as any).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockRejectedValueOnce(new Error('DB error'))
      });

      await expect(permissionService.getPermissionsByScope(PermissionScope.GLOBAL))
        .rejects
        .toThrow(new ErrorResponse('DB error', 500));
    });
  });
});