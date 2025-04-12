import { DeleteResult } from 'mongodb';
import { deleteImage, uploadImage } from '../../utils/cloudinary';
import ErrorResponse from '../../utils/errorResponse';
import { extractPublicIdFromUrl } from '../../utils/extractUrl';
import User, { UserDocument } from '../user/user.model';
import Organization, { IOrganization } from './organization.model';
import Role, { IRole } from '../role/role.model'; // Import Role model
import Permission, { PermissionScope } from '../permission/permission.model'; // Import Permission model
import mongoose from 'mongoose';

class OrganizationService {
 /**
   * Create a new organization (Admin only)
   * Called by an Admin. Owner is assigned in a separate step.
   * @param name - Organization name
   * @param facilities - List of facilities
   * @param images - Array of image files
   * @param location - Location object
   * @returns Promise<IOrganization>
   */
  public async createOrganization(
    name: string,
    facilities: string[],
    images: Express.Multer.File[],
    location: IOrganization['location'],
   
  ): Promise<IOrganization | null> {
    try {
      // Upload images to Cloudinary
      const imageUploads = images.map(image => uploadImage(image));
      const uploadedImages = await Promise.all(imageUploads);
      const imageUrls = uploadedImages.map(img => img.url);

      

      // Create organization with owner and permissions
      const organization = new Organization({
        name,
        facilities,
        images: imageUrls,
        location,
       
      });

      await organization.save();

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
   public async assignOwnerToOrganization(organizationId: string, userId: string): Promise<IOrganization> {
    // Permission check ('assign_organization_owner') should happen in the route middleware
    try {
       const organization = await Organization.findById(organizationId);
       if (!organization) throw new ErrorResponse('Organization not found', 404);
       if (organization.owner) throw new ErrorResponse('Organization already has an owner assigned', 400);

       const user = await User.findById(userId);
       if (!user) throw new ErrorResponse('User to assign as owner not found', 404);

       // 1. Find or Create the 'Organization Owner' role for THIS organization
       const ownerRoleName = 'Organization Owner';
       let ownerRole = await Role.findOne({
           name: ownerRoleName,
           scope: PermissionScope.ORGANIZATION,
           scopeId: organization._id
       });

       if (!ownerRole) {
           // Find all permissions with 'organization' scope
           const orgPermissions = await Permission.find({ scope: PermissionScope.ORGANIZATION }).select('_id');
           ownerRole = await Role.create({
               name: ownerRoleName,
               scope: PermissionScope.ORGANIZATION,
               scopeId: organization._id,
               permissions: orgPermissions.map(p => p._id),
               isDefault: true, // Mark as a default role
           });
       }

       // 2. Assign the role to the user within the organization context
       const existingAssignment = user.organizationRoles.find(
           (assignment) => assignment.organizationId.equals(organization._id) // && assignment.role.equals(ownerRole._id) // User should only have one role per org initially? Or allow multiple? Let's assume one for owner.
       );

       if (existingAssignment) {
           // Decide: Replace existing role or throw error? For owner, maybe replace.
            console.warn(`User ${userId} already had a role in organization ${organizationId}. Replacing with Owner role.`);
            // Remove previous assignment
            user.organizationRoles = user.organizationRoles.filter(a => !a.organizationId.equals(organization._id));
       }

       user.organizationRoles.push({
           organizationId: organization._id,
           role: ownerRole._id,
       });
       await user.save();

       // 3. Update the organization document with the owner ID
       organization.owner = user._id;
       await organization.save();

       console.log(`User ${user.email} assigned as owner of organization ${organization.name}`);
       return organization;

    } catch (error: any) {
       console.error("Error assigning organization owner:", error);
       throw new ErrorResponse(error.message || 'Failed to assign owner', error.statusCode || 500);
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
   public async createOrganizationRole(organizationId: string, roleName: string, permissionNames: string[]): Promise<IRole> {
    // Permission check ('manage_organization_roles') in middleware
    try {
        const organization = await Organization.findById(organizationId);
        if (!organization) throw new ErrorResponse('Organization not found', 404);

        // Validate role name uniqueness within this org
        const existingRole = await Role.findOne({ name: roleName, scope: PermissionScope.ORGANIZATION, scopeId: organizationId });
        if (existingRole) throw new ErrorResponse(`Role '${roleName}' already exists in this organization`, 400);

        // Validate permissions exist and are correctly scoped
        const permissions = await Permission.find({
            name: { $in: permissionNames },
            scope: PermissionScope.ORGANIZATION // Ensure only org-scoped permissions are assigned
        }).select('_id name');

        const foundPermissionNames = permissions.map(p => p.name);
        const notFoundPermissions = permissionNames.filter(name => !foundPermissionNames.includes(name));
        if (notFoundPermissions.length > 0) {
            throw new ErrorResponse(`Invalid or non-organizational permissions specified: ${notFoundPermissions.join(', ')}`, 400);
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
        console.error("Error creating organization role:", error);
        throw new ErrorResponse(error.message || 'Failed to create role', error.statusCode || 500);
    }
}

  /**
   * Assign an organization role to a user (Requires 'assign_organization_roles')
   * @param organizationId
   * @param userId
   * @param roleId - The ID of the role to assign (must be scoped to this organization)
   */
  public async assignRoleToUser(organizationId: string, userId: string, roleId: string): Promise<UserDocument> {
    // Permission check ('assign_organization_roles') in middleware
    try {
        const [user, roleToAssign, organization] = await Promise.all([
            User.findById(userId),
            Role.findById(roleId),
            Organization.findById(organizationId).select('_id') // Just check existence
        ]);

        if (!user) throw new ErrorResponse('User not found', 404);
        if (!organization) throw new ErrorResponse('Organization not found', 404);
        if (!roleToAssign) throw new ErrorResponse('Role not found', 404);

        // Validate role scope
        if (roleToAssign.scope !== PermissionScope.ORGANIZATION || !roleToAssign.scopeId?.equals(organizationId)) {
            throw new ErrorResponse(`Role '${roleToAssign.name}' does not belong to this organization`, 400);
        }

        // Prevent assigning the default 'Organization Owner' role manually? (Optional)
        // if (roleToAssign.isDefault && roleToAssign.name === 'Organization Owner') {
        //     throw new ErrorResponse('Cannot manually assign the default Owner role. Use the "assign owner" function.', 400);
        // }

        // Check if user already has this specific role in this org
        const alreadyHasRole = user.organizationRoles.some(
            a => a.organizationId.equals(organizationId) && a.role.equals(roleId)
        );
        if (alreadyHasRole) {
            throw new ErrorResponse(`User already has the role '${roleToAssign.name}' in this organization`, 400);
        }

        // Add the assignment
        user.organizationRoles.push({
            organizationId: new mongoose.Types.ObjectId(organizationId),
            role: roleToAssign._id,
        });

        await user.save();
        return user; // Return updated user document

    } catch (error: any) {
        console.error("Error assigning role to user:", error);
        throw new ErrorResponse(error.message || 'Failed to assign role', error.statusCode || 500);
    }
 }

 

}

export const organizationService = new OrganizationService();
