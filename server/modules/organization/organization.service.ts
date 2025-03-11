import Organization, { IOrganization } from "./organization.model";
import { uploadImage, deleteImage } from "../../utils/cloudinary";
import ErrorResponse from "../../utils/errorResponse";
import { DeleteResult } from "mongodb";
import { extractPublicIdFromUrl } from "../../utils/extractUrl";

class OrganizationService {
  /**
   * Create a new organization
   * @param name - Organization name
   * @param facilities - List of facilities
   * @param images - Array of image files (Express Multer files)
   * @param location - Location object (from Barikoi API)
   * @returns Promise<IOrganization>
   */
  public async createOrganization(
    name: string,
    facilities: string[],
    images: Express.Multer.File[],
    location: IOrganization["location"]
  ): Promise<IOrganization | null> {
    try {
      // Upload images to Cloudinary
      const imageUploads = images.map((image) => uploadImage(image));
      const uploadedImages = await Promise.all(imageUploads);

      // Extract image URLs and public IDs
      const imageUrls = uploadedImages.map((img) => img.url);

      // Create organization
      const organization = await Organization.create({
        name,
        facilities,
        images: imageUrls,
        location,
      });

      return organization;
    } catch (error) {
      console.error(error);
      throw new ErrorResponse("Failed to create organization", 500);
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
    newImages?: Express.Multer.File[]
  ): Promise<IOrganization | null> {
    try {
      const organization = await Organization.findById(id);
      if (!organization) throw new ErrorResponse("Organization not found", 404);

      // Handle image updates
      if (newImages && newImages.length > 0) {
        // Upload new images
        const newImageUploads = newImages.map((image) => uploadImage(image));
        const uploadedNewImages = await Promise.all(newImageUploads);
        const newImageUrls = uploadedNewImages.map((img) => img.url);

        // Delete old images from Cloudinary
        if (organization.images.length > 0) {
          await Promise.all(
            organization.images.map((imgUrl) => {
              const publicId = extractPublicIdFromUrl(imgUrl);
              return publicId ? deleteImage(publicId) : Promise.resolve();
            })
          );
        }

        updateData.images = newImageUrls;
      }

      // Update organization
      const updatedOrganization = await Organization.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      return updatedOrganization;
    } catch (error) {
      console.error(error);
      throw new ErrorResponse("Failed to update organization", 500);
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
      if (!organization) throw new ErrorResponse("Organization not found", 404);

      // Delete images from Cloudinary
      if (organization.images.length > 0) {
        await Promise.all(
          organization.images.map((imgUrl) => {
            const publicId = extractPublicIdFromUrl(imgUrl);
            return publicId ? deleteImage(publicId) : Promise.resolve();
          })
        );
      }

      // Delete from database
      return await Organization.deleteOne({ _id: id });
    } catch (error) {
      console.error(error);
      throw new ErrorResponse("Failed to delete organization", 500);
    }
  }
}

export const organizationService = new OrganizationService();
