import multer from "multer";
import { Request } from "express";

export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  destination?: string;
  filename?: string;
  path?: string;
}

// Configure storage - using memory storage for Cloudinary integration
const storage = multer.memoryStorage();

// Configure file filter to only accept images
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback
) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(
      new Error(
        "Invalid file type. Only JPEG, PNG, GIF and WEBP files are allowed."
      )
    );
  }
};


const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
  },
});

// Export function to get single file upload middleware
export const uploadSingle = (fieldName: string = "image") =>
  upload.single(fieldName);

// Export function to get multiple files upload middleware
export const uploadMultiple = (
  fieldName: string = "images",
  maxCount: number = 5
) => upload.array(fieldName, maxCount);

// Export function to get fields upload middleware
export const uploadFields = (fields: { name: string; maxCount: number }[]) =>
  upload.fields(fields);


 