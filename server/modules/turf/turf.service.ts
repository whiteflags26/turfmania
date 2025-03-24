import mongoose from "mongoose";
import Organization from "../organization/organization.model";
import { ITurf, Turf } from "./turf.model";
import { uploadImage, deleteImage } from "../../utils/cloudinary";
import ErrorResponse from "./../../utils/errorResponse";
import { extractPublicIdFromUrl } from "../../utils/extractUrl";

export default class TurfService {
  /**@desc Create new turf with image upload and data validation**/

  async createTurf(
    turfData: Partial<ITurf>,
    images?: Express.Multer.File[]
  ): Promise<ITurf> {
    try {
      // Upload images if provided
      let imageUrls: string[] = [];
      if (images && images.length > 0) {
        const uploadPromises = images.map((image) => uploadImage(image));
        const uploadedImages = await Promise.all(uploadPromises);
        imageUrls = uploadedImages.map((img) => img.url);
      }

      // Create turf with or without images
      const turf = new Turf({
        ...turfData,
        images: imageUrls,
      });

      return await turf.save();
    } catch (error) {
      console.error(error);
      throw new ErrorResponse("Failed to create turf", 500);
    }
  }

  /**@desc Retrieve all turfs with basic filtering options **/

  async getTurfs(filters = {}): Promise<ITurf[]> {
    return await Turf.find(filters);
  }

  /**@desc Retrieve turf by ID **/
  async getTurfById(id: string): Promise<ITurf | null> {
    return await Turf.findById(id);
  }

  /**@desc Update turf by ID with image upload and data validation **/
  async updateTurf(
    id: string,
    updateData: Partial<ITurf>,
    newImages?: Express.Multer.File[]
  ): Promise<ITurf | null> {
    try {
      const turf = await Turf.findById(id);
      if (!turf) throw new ErrorResponse("Turf not found", 404);

      // Handle image updates
      if (newImages && newImages.length > 0) {
        // Upload new images
        const uploadPromises = newImages.map((image) => uploadImage(image));
        const uploadedImages = await Promise.all(uploadPromises);
        const newImageUrls = uploadedImages.map((img) => img.url);

        // Delete old images if they exist
        if (turf.images.length > 0) {
          await Promise.all(
            turf.images.map((imgUrl) => {
              const publicId = extractPublicIdFromUrl(imgUrl);
              return publicId ? deleteImage(publicId) : Promise.resolve();
            })
          );
        }

        updateData.images = newImageUrls;
      }

      const updatedTurf = await Turf.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      return updatedTurf;
    } catch (error) {
      console.error(error);
      throw new ErrorResponse("Failed to update turf", 500);
    }
  }

  /**@desc Delete turf by ID **/
  async deleteTurf(id: string): Promise<ITurf | null> {
    try {
      const turf = await Turf.findById(id);
      if (!turf) return null;

      // Delete images from Cloudinary
      if (turf.images && turf.images.length > 0) {
        await Promise.all(
          turf.images.map(async (imageUrl) => {
            const publicId = extractPublicIdFromUrl(imageUrl);
            if (publicId) {
              await deleteImage(publicId);
            }
          })
        );
      }

      return await Turf.findByIdAndDelete(id);
    } catch (error) {
      console.error("Error deleting turf:", error);
      throw new ErrorResponse("Failed to delete turf", 500);
    }
  }
}
