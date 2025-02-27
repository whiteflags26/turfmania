import Organization, { IOrganization } from "./organization.model";
import { uploadImage } from "../../utils/cloudinary";
import ErrorResponse from "../../utils/errorResponse";

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
  ): Promise<IOrganization> {
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
      throw new ErrorResponse("Failed to create organization", 500);
    }
  }
}

export const organizationService = new OrganizationService();
