import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import ErrorResponse from "./errorResponse";
import { MulterFile } from "../shared/service/multerService";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload an image to Cloudinary
 * @param file - The image file (MulterFile or Buffer)
 * @param folder - The folder in Cloudinary (default: 'turfmania')
 * @returns Promise<{ public_id: string; url: string }>
 */
export const uploadImage = async (
  file: MulterFile | Buffer,
  folder: string = "turfmania"
): Promise<{ public_id: string; url: string }> => {
  try {
    // Convert file to a readable stream
    const fileStream = Buffer.isBuffer(file)
      ? new Readable({
          read() {
            this.push(file);
            this.push(null); // Signal end of stream
          },
        })
      : new Readable({
          read() {
            this.push(file.buffer);
            this.push(null); // Signal end of stream
          },
        });

    // Upload to Cloudinary
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder },
        (error, result) => {
          if (error) reject(new ErrorResponse("Image upload failed", 500));
          else resolve(result);
        }
      );

      fileStream.pipe(uploadStream);
    });

    return {
      public_id: result.public_id,
      url: result.secure_url,
    };
  } catch (error) {
    throw new ErrorResponse("Failed to upload image", 500);
  }
};

/**
 * Delete an image from Cloudinary
 * @param public_id - The public ID of the image
 */
export const deleteImage = async (public_id: string) => {
  try {
    await cloudinary.uploader.destroy(public_id);
  } catch (error) {
    throw new ErrorResponse("Failed to delete image", 500);
  }
};
