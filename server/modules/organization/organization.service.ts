import { DeleteResult } from 'mongodb';
import { deleteImage, uploadImage } from '../../utils/cloudinary';
import ErrorResponse from '../../utils/errorResponse';
import { extractPublicIdFromUrl } from '../../utils/extractUrl';
import User from '../user/user.model';
import Organization, { IOrganization } from './organization.model';

class OrganizationService {
  /**
   * Create a new organization
   * @param name - Organization name
   * @param facilities - List of facilities
   * @param images - Array of image files (Express Multer files)
   * @param location - Location object (from Barikoi API)
   * @param userId - User ID of the organization owner
   * @returns Promise<IOrganization>
   */
  public async createOrganization(
    name: string,
    facilities: string[],
    images: Express.Multer.File[],
    location: IOrganization['location'],
    userId: string, // Add userId parameter
  ): Promise<IOrganization | null> {
    try {
      // Upload images to Cloudinary
      const imageUploads = images.map(image => uploadImage(image));
      const uploadedImages = await Promise.all(imageUploads);
      const imageUrls = uploadedImages.map(img => img.url);

      // Set up default permissions and roles
      const defaultPermissions = new Map([
        ['roleManage', ['owner']],
        ['update', ['owner', 'manager']],
        ['delete', ['owner']],
        ['addStaff', ['owner', 'manager']],
        ['removeStaff', ['owner', 'manager']],
        ['viewReports', ['owner', 'manager']],
        ['manageBookings', ['owner', 'manager', 'staff']],
      ]);

      // Create organization with owner and permissions
      const organization = await Organization.create({
        name,
        facilities,
        images: imageUrls,
        location,
        owner: userId,
        userRoles: [
          {
            user: userId,
            role: 'owner',
          },
        ],
        permissions: defaultPermissions,
      });

      return organization;
    } catch (error) {
      console.error(error);
      throw new ErrorResponse('Failed to create organization', 500);
    }
  }

  /**
   * Update an organization
   * @param id - Organization ID
   * @param updateData - Partial organization data
   * @param newImages - Array of new image files (optional)
   * @returns Promise<IOrganization | null>
   */
  public async updateOrganization(
    id: string,
    updateData: Partial<IOrganization>,
    newImages?: Express.Multer.File[],
  ): Promise<IOrganization | null> {
    try {
      const organization = await Organization.findById(id);
      if (!organization) throw new ErrorResponse('Organization not found', 404);

      // Handle image updates
      if (newImages && newImages.length > 0) {
        // Upload new images
        const newImageUploads = newImages.map(image => uploadImage(image));
        const uploadedNewImages = await Promise.all(newImageUploads);
        const newImageUrls = uploadedNewImages.map(img => img.url);

        // Delete old images from Cloudinary
        if (organization.images.length > 0) {
          await Promise.all(
            organization.images.map(imgUrl => {
              const publicId = extractPublicIdFromUrl(imgUrl);
              return publicId ? deleteImage(publicId) : Promise.resolve();
            }),
          );
        }

        updateData.images = newImageUrls;
      }

      // Update organization
      const updatedOrganization = await Organization.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true },
      );

      return updatedOrganization;
    } catch (error) {
      console.error(error);
      throw new ErrorResponse('Failed to update organization', 500);
    }
  }

  /**
   * Delete an organization
   * @param id - Organization ID
   * @returns Promise<DeleteResult>
   */
  public async deleteOrganization(id: string): Promise<DeleteResult> {
    try {
      const organization = await Organization.findById(id);
      if (!organization) throw new ErrorResponse('Organization not found', 404);

      // Delete images from Cloudinary
      if (organization.images.length > 0) {
        await Promise.all(
          organization.images.map(imgUrl => {
            const publicId = extractPublicIdFromUrl(imgUrl);
            return publicId ? deleteImage(publicId) : Promise.resolve();
          }),
        );
      }

      // Delete from database
      return await Organization.deleteOne({ _id: id });
    } catch (error) {
      console.error(error);
      throw new ErrorResponse('Failed to delete organization', 500);
    }
  }
  public async addUserToTurf(
    userId: string,
    role: string,
    organizationId: string,
  ): Promise<IOrganization | null> {
    try {
      const [userToAdd, organization] = await Promise.all([
        User.findById(userId),
        Organization.findById(organizationId),
      ]);
      if (!organization) throw new ErrorResponse('Organization not found', 404);
      if (!userToAdd) throw new ErrorResponse('No user to add', 404);

      const existingRole = organization.userRoles.find(
        userRole => userRole.user.toString() === userId.toString(),
      );
      if (existingRole)
        throw new ErrorResponse('The user is already assigned to a role', 400);
      const updatedOrganization = await Organization.findByIdAndUpdate(
        organizationId,
        {
          $push: {
            userRoles: { user: userId, role: role },
          },
        },
        {
          new: true,
          runValidators: true,
        },
      );
      return updatedOrganization;
    } catch (error) {
      console.error(error);
      throw new ErrorResponse('Failed to add user to turf', 500);
    }
  }

  public async updateOrganizationPermissions(
    organizationId: string,
    userId: string,
    permissions: Record<string, string[]>,
  ): Promise<IOrganization | null> {
    try {
      const organization = await Organization.findById(organizationId);
      if (!organization) throw new ErrorResponse('Organization not found', 404);

      // Verify ownership
      if (organization.owner.toString() !== userId) {
        throw new ErrorResponse('Not authorized to update permissions', 401);
      }

      // Validate and convert permissions to Map
      const permissionsMap = new Map<string, string[]>();
      for (const [action, roles] of Object.entries(permissions)) {
        if (!Array.isArray(roles)) {
          throw new ErrorResponse(`Roles for ${action} must be an array`, 400);
        }

        const validRoles = roles.every(role =>
          ['owner', 'manager', 'staff'].includes(role),
        );
        if (!validRoles) {
          throw new ErrorResponse(
            'Invalid role specified. Roles must be owner, manager, or staff',
            400,
          );
        }

        permissionsMap.set(action, roles);
      }

      const updatedOrganization = await Organization.findByIdAndUpdate(
        organizationId,
        { permissions: permissionsMap },
        { new: true, runValidators: true },
      ).select('permissions');

      return updatedOrganization;
    } catch (error) {
      console.error(error);
      throw error instanceof ErrorResponse
        ? error
        : new ErrorResponse('Failed to update permissions', 500);
    }
  }
}

export const organizationService = new OrganizationService();
