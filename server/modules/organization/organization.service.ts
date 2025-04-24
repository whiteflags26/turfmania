import { DeleteResult } from 'mongodb';
import { Types } from 'mongoose';
import { deleteImage, uploadImage } from '../../utils/cloudinary';
import ErrorResponse from '../../utils/errorResponse';
import { extractPublicIdFromUrl } from '../../utils/extractUrl';
import Permission, { PermissionScope } from '../permission/permission.model'; // Import Permission model
import Role, { IRole } from '../role/role.model'; // Import Role model
import UserRoleAssignment from '../role_assignment/userRoleAssignment.model';
import User from '../user/user.model';
import Organization, { IOrganization } from './organization.model';
import OrganizationRequestService from "../organization-request/organization-request.service";
import mongoose from 'mongoose';

export interface IOrganizationRoleAssignment {
  organizationId: Types.ObjectId;
  role: Types.ObjectId;
}

class OrganizationService {

  organizationRequestService = new OrganizationRequestService();

  /**
 * Create a new organization (Admin only)
 * Called by an Admin. Owner is assigned in a separate step if no requestId is provided.
 * If requestId is provided, owner is assigned as part of the creation process.
 * @param name - Organization name
 * @param facilities - List of facilities
 * @param images - Array of image files
 * @param location - Location object
 * @param requestId - Optional organization request ID
 * @param adminId - ID of admin creating the organization
 * @param wasEdited - Whether request was edited during approval process
 * @returns Promise<IOrganization>
 */
public async createOrganization(
  name: string,
  facilities: string[],
  location: IOrganization['location'],
  images?: Express.Multer.File[],
  requestId?: string,
  adminId?: string,
  wasEdited: boolean = false,
  adminNotes?: string
): Promise<IOrganization | null> {
  try {
    let imageUrls: string[] = [];

    // Only process images if they exist
    if (images && images.length > 0) {
      const imageUploads = images.map(image => uploadImage(image));
      const uploadedImages = await Promise.all(imageUploads);
      imageUrls = uploadedImages.map(img => img.url);
    }

    // Create organization with owner and permissions
    const organization = new Organization({
      name,
      facilities,
      images: imageUrls,
      location,
    });

    await organization.save();
    
    // If requestId is provided, approve the organization request and assign owner
    if (requestId && adminId) {
      try {        
        // Get the request to extract the owner email
        const request = await mongoose.model('OrganizationRequest').findById(requestId);
        if (!request) {
          throw new ErrorResponse('Organization request not found', 404);
        }

        // Find the owner user from the request's ownerEmail
        const owner = await User.findOne({ email: request.ownerEmail }).collation({ locale: 'en', strength: 2 });
        if (!owner) {
          throw new ErrorResponse('Owner user not found', 404);
        }

        if(!organization?._id) {
          throw new ErrorResponse('Organization ID not found', 404);
        }

        // Now also assign the default organization owner role
        await this.assignOwnerToOrganization(organization._id.toString(), owner._id.toString());
        
        // Approve the request with the newly created organization ID
        await this.organizationRequestService.approveRequest(
          requestId,
          adminId,
          organization._id.toString(),
          wasEdited,
          adminNotes
        );
        
        console.log(`Organization request ${requestId} approved and linked to organization ${organization._id}`);
      } catch (error) {
        console.error('Failed to process organization request:', error);
        // Continue with organization creation even if request processing fails
      }
    }
    
    return organization;
  } catch (error) {
    console.error(error);
    throw new ErrorResponse('Failed to create organization', 500);
  }
}

  /**
   * Assign a user as the owner of an organization (Admin only)
   * Creates the default 'Organization Owner' role for this org and assigns it.
   * @param organizationId - The ID of the organization
   * @param userId - The ID of the user to be assigned as owner
   * @returns Promise<IOrganization> - Updated organization
   */
  public async assignOwnerToOrganization(
    organizationId: string,
    userId: string,
  ): Promise<IOrganization> {
    try {
      const organization = await Organization.findById(organizationId);
      if (!organization) throw new ErrorResponse('Organization not found', 404);

      const user = await User.findById(userId);
      if (!user) throw new ErrorResponse('User not found', 404);

      // 1. Define the role name and get permissions
      const ownerRoleName = 'Organization Owner';
      const orgPermissions = await Permission.find({
        scope: PermissionScope.ORGANIZATION,
      }).select('_id');

      // 2. Find or create the owner role (without scopeId)
      const ownerRole = await Role.findOneAndUpdate(
        {
          name: ownerRoleName,
          scope: PermissionScope.ORGANIZATION,
        },
        {
          $set: {
            name: ownerRoleName,
            scope: PermissionScope.ORGANIZATION,
            permissions: orgPermissions.map(p => p._id),
            isDefault: true,
          },
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
        },
      );

      if (!ownerRole) {
        throw new ErrorResponse(
          'Failed to find or create Organization Owner role',
          500,
        );
      }

      // 3. Create/Update role assignment in junction table
      await UserRoleAssignment.findOneAndUpdate(
        {
          userId: user._id,
          roleId: ownerRole._id,
          scope: PermissionScope.ORGANIZATION,
          scopeId: organization._id,
        },
        {
          $set: {
            userId: user._id,
            roleId: ownerRole._id,
            scope: PermissionScope.ORGANIZATION,
            scopeId: organization._id,
          },
        },
        {
          upsert: true,
          runValidators: true,
        },
      );

      // 4. Update organization with owner
      await organization.save();

      console.log(
        `User ${user.email} assigned as owner of organization ${organization.name}`,
      );
      return organization;
    } catch (error: any) {
      console.error('Error assigning organization owner:', error);
      throw new ErrorResponse(
        error.message ?? 'Failed to assign owner',
        error.statusCode ?? 500,
      );
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
  /**
   * Create a new role within an organization (Requires 'manage_organization_roles')
   * @param organizationId
   * @param roleName
   * @param permissionNames - Array of permission NAMES (e.g., ['create_turf', 'view_organization_reports'])
   */
  public async createOrganizationRole(
    organizationId: string,
    roleName: string,
    permissionNames: string[],
  ): Promise<IRole> {
    // Permission check ('manage_organization_roles') in middleware
    try {
      const organization = await Organization.findById(organizationId);
      if (!organization) throw new ErrorResponse('Organization not found', 404);
      if (
        typeof roleName !== 'string' ||
        !/^[a-zA-Z0-9\s-_]+$/.exec(roleName)
      ) {
        throw new ErrorResponse('Role name contains invalid characters', 400);
      }
      // Validate role name uniqueness within this org
      const existingRole = await Role.findOne({
        name: roleName,
        scope: PermissionScope.ORGANIZATION,
        scopeId: organizationId,
      });
      if (existingRole)
        throw new ErrorResponse(
          `Role '${roleName}' already exists in this organization`,
          400,
        );

      // Validate permissions exist and are correctly scoped
      const permissions = await Permission.find({
        name: { $in: permissionNames },
        scope: PermissionScope.ORGANIZATION, // Ensure only org-scoped permissions are assigned
      }).select('_id name');

      const foundPermissionNames = permissions.map(p => p.name);
      const notFoundPermissions = permissionNames.filter(
        name => !foundPermissionNames.includes(name),
      );
      if (notFoundPermissions.length > 0) {
        throw new ErrorResponse(
          `Invalid or non-organizational permissions specified: ${notFoundPermissions.join(
            ', ',
          )}`,
          400,
        );
      }

      const newRole = await Role.create({
        name: roleName,
        scope: PermissionScope.ORGANIZATION,
        scopeId: organizationId,
        permissions: permissions.map(p => p._id),
        isDefault: false, // Custom roles are not default
      });

      return newRole;
    } catch (error: any) {
      console.error('Error creating organization role:', error);
      throw new ErrorResponse(
        error.message ?? 'Failed to create role',
        error.statusCode ?? 500,
      );
    }
  }
}

export const organizationService = new OrganizationService();
