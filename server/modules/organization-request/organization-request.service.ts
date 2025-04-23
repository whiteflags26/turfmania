import { Types } from "mongoose";
import fs from "fs/promises";
import path from "path";
import validator from "validator";

import User from "../user/user.model";
import OrganizationRequest, {
  RequestStatus,
  IOrganizationRequest,
} from "./organization-request.model";
import { uploadImage } from "../../utils/cloudinary";
import { organizationService } from "../organization/organization.service";
import ErrorResponse from "../../utils/errorResponse";
import { sendEmail } from "../../utils/email";

interface CreateRequestDto {
  name: string;
  facilities: string[];
  location: {
    place_id: string;
    address: string;
    coordinates: {
      type: "Point";
      coordinates: [number, number];
    };
    area?: string;
    sub_area?: string;
    city: string;
    post_code?: string;
  };
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  ownerEmail: string;
  requestNotes?: string;
}

interface ProcessingResult {
  success: boolean;
  message: string;
  data?: any;
}

const TEMP_IMAGE_DIR = path.join(process.cwd(), "uploads", "temp");

export default class OrganizationRequestService {

  // Validates the owner email by checking if it exists in the user database
  public async validateOwnerEmail(email: string): Promise<boolean> {
    if (!email || !validator.isEmail(email)) {
      return false;
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).collation({ locale: "en", strength: 2 });

    return !!user;
  }

  // Creates a new organization request
  public async createRequest(
    requesterId: string,
    requestData: CreateRequestDto,
    images?: Express.Multer.File[]
  ): Promise<IOrganizationRequest> {
    const tempImagePaths: string[] = [];
    try {
      // Validate owner email exists in database
      const ownerExists = await this.validateOwnerEmail(requestData.ownerEmail);
      if (!ownerExists) {
        throw new ErrorResponse(
          "Owner email does not exist in the user database",
          400
        );
      }

      // Handle images - save to temp location
      if (images && images.length > 0) {
        // Ensure temp directory exists
        await fs.mkdir(TEMP_IMAGE_DIR, { recursive: true });

        // Save each image to temp dir with unique name
        for (const image of images) {
          const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${
            image.originalname
          }`;
          const filePath = path.join(TEMP_IMAGE_DIR, fileName);
          await fs.writeFile(filePath, image.buffer);
          tempImagePaths.push(filePath);
        }
      }

      // Create request
      const request = await OrganizationRequest.create({
        requesterId,
        status: "pending",
        ...requestData,
        tempImagePaths,
      });

      return request;
    } catch (error) {
      /// Clean up any temp files if error occurs
      await this.cleanupTempImages(tempImagePaths);
      throw error;
    }
  }

  // Cleanup temporary images
  private async cleanupTempImages(paths: string[]): Promise<void> {
    for (const path of paths) {
      try {
        await fs.unlink(path);
      } catch (err) {
        console.error(`Failed to delete temp file ${path}:`, err);
        // Continue with other files
      }
    }
  }

  // Process an organization request (approve/reject)
  public async startProcessing(
    requestId: string,
    adminId: string
  ): Promise<IOrganizationRequest> {
    const request = await OrganizationRequest.findById(requestId);
    if (!request) {
      throw new ErrorResponse("Request not found", 404);
    }

    if (request.status !== "pending") {
      throw new ErrorResponse(
        `Request cannot be processed. Current status: ${request.status}`,
        400
      );
    }

    request.status = "processing";
    request.processingAdminId = new Types.ObjectId(adminId);
    request.processingStartedAt = new Date();
    await request.save();

    return request;
  }

  // Cancel processing of a request
  public async cancelProcessing(
    requestId: string,
    adminId: string
  ): Promise<IOrganizationRequest> {
    const request = await OrganizationRequest.findById(requestId);
    if (!request) {
      throw new ErrorResponse("Request not found", 404);
    }

    if (request.status !== "processing") {
      throw new ErrorResponse("Request is not currently being processed", 400);
    }

    request.status = "pending";
    request.processingAdminId = undefined;
    request.processingStartedAt = undefined;
    await request.save();

    return request;
  }
}