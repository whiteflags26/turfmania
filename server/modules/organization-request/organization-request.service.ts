// organization-request.service.ts (Updated)
import mongoose, { Types } from "mongoose";
import validator from "validator";

import User from "../user/user.model";
import OrganizationRequest, {
  RequestStatus,
  IOrganizationRequest,
} from "./organization-request.model";
import { uploadImage } from "../../utils/cloudinary";
import ErrorResponse from "../../utils/errorResponse";
import { sendEmail } from "../../utils/email";

interface CreateRequestDto {
  organizationName: string;
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
  contactPhone: string;
  ownerEmail: string;
  requestNotes?: string;
}

interface ProcessingResult {
  success: boolean;
  message: string;
  data?: any;
}

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

  // Creates a new organization request with images directly uploaded to Cloudinary
  public async createRequest(
    requesterId: string,
    requestData: CreateRequestDto,
    images?: Express.Multer.File[]
  ): Promise<IOrganizationRequest> {
    try {
      // Validate owner email exists in database
      const ownerExists = await this.validateOwnerEmail(requestData.ownerEmail);
      if (!ownerExists) {
        throw new ErrorResponse(
          "Owner email does not exist in the user database",
          400
        );
      }

      // Upload images directly to Cloudinary
      const imageUrls: string[] = [];
      if (images && images.length > 0) {
        const uploadPromises = images.map((image) => uploadImage(image));
        const uploadResults = await Promise.all(uploadPromises);
        imageUrls.push(...uploadResults.map((result) => result.url));
      }

      // Create request
      const request = await OrganizationRequest.create({
        requesterId,
        status: "pending",
        ...requestData,
        images: imageUrls, // Store Cloudinary URLs directly
      });

      return request;
    } catch (error) {
      throw error;
    }
  }

  // Process an organization request
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

  // Approve request and link to an existing organization
public async approveRequest(
  requestId: string,
  adminId: string,
  organizationId: string,
  wasEdited: boolean = false
): Promise<ProcessingResult> {
  const request = await OrganizationRequest.findById(requestId);
  if (!request) {
    throw new ErrorResponse("Request not found", 404);
  }

  if (request.status !== "processing") {
    throw new ErrorResponse("Request is not in processing state", 400);
  }

  try {
    // Set the status based on whether the data was edited
    request.status = wasEdited ? "approved_with_changes" : "approved";
    
    // Set the organizationId reference
    request.organizationId = new mongoose.Types.ObjectId(organizationId);
    await request.save();

    // Notify requester
    await this.notifyRequestProcessed(request, true, wasEdited);

    return {
      success: true,
      message: wasEdited 
        ? "Organization request approved with changes" 
        : "Organization request approved successfully",
      data: { request },
    };
  } catch (error: any) {
    console.error("Error approving request:", error);
    throw new ErrorResponse(
      error.message || "Failed to approve organization request",
      error.statusCode || 500
    );
  }
}

// Notify the requester about the request status
private async notifyRequestProcessed(
  request: IOrganizationRequest,
  approved: boolean,
  wasEdited: boolean = false
): Promise<void> {
  try {
    const user = await User.findById(request.requesterId);
    if (!user) {
      console.error(`User ${request.requesterId} not found for notification`);
      return;
    }

    const isOwner = user.email === request.ownerEmail;
    const subject = this.getEmailSubject(approved);
    const recipientName = this.getRecipientName(user, isOwner);

    // Build main message
    const message = this.buildMainMessage(
      recipientName,
      request,
      approved,
      wasEdited,
      isOwner
    );

    // Handle owner notifications
    await this.handleOwnerNotifications(
      user,
      request,
      subject,
      message,
      approved,
      wasEdited,
      isOwner
    );
  } catch (error) {
    console.error("Failed to send notification email:", error);
  }
}

// Helper functions

private getEmailSubject(approved: boolean): string {
  return approved
    ? "Organization Request Approved - TurfMania"
    : "Organization Request Rejected - TurfMania";
}

private getRecipientName(user: any, isOwner: boolean): string {
  return user.name || (isOwner ? "Owner" : "Valued Customer");
}

private buildMainMessage(
  recipientName: string,
  request: IOrganizationRequest,
  approved: boolean,
  wasEdited: boolean,
  isOwner: boolean
): string {
  let message = `Dear ${recipientName},\n\n`;

  if (approved) {
    message += this.buildApprovalMessage(request, wasEdited, isOwner);
  } else {
    message += this.buildRejectionMessage(request);
  }

  message += this.getCommonFooter();
  return message;
}

private buildApprovalMessage(
  request: IOrganizationRequest,
  wasEdited: boolean,
  isOwner: boolean
): string {
  let message = 
    `We are pleased to inform you that your request to create organization "${request.organizationName}" has been approved${wasEdited ? " with some changes" : ""}.\n\n` +
    `The organization has been successfully created in our system and is now active.\n` +
    (request.organizationId ? `Organization ID: ${request.organizationId}\n\n` : "\n");
  
  if (wasEdited) {
    message += `Please note that some details of your request were modified during the approval process. You can view the final organization details in your dashboard.\n\n`;
  }

  if (isOwner) {
    message += `As the owner of "${request.organizationName}", you now have full administrative access to manage the organization.\n\n`;
  }

  return message;
}

private buildRejectionMessage(request: IOrganizationRequest): string {
  let message = `We regret to inform you that your request to create organization "${request.organizationName}" has been rejected.\n\n`;

  if (request.adminNotes) {
    message +=
      `Reason: ${request.adminNotes}\n\n` +
      `You may submit a new request after addressing the issues mentioned above.\n\n`;
  }

  return message;
}

private getCommonFooter(): string {
  return (
    `If you have any questions or need further assistance, please don't hesitate to contact our support team at supportMail@gmail.com.\n\n` +
    `Thank you for choosing TurfMania!\n\n` +
    `Best regards,\n` +
    `The TurfMania Team\n\n` +
    `[This is an automated message. Please do not reply directly to this email.]`
  );
}

private async handleOwnerNotifications(
  user: any,
  request: IOrganizationRequest,
  subject: string,
  message: string,
  approved: boolean,
  wasEdited: boolean,
  isOwner: boolean
): Promise<void> {
  if (isOwner) {
    // Send owner-specific message
    await sendEmail(user.email, subject, message);
  } else {
    // Send standard message to requester
    await sendEmail(user.email, subject, message);

    // Send owner-specific message to owner (if different)
    const ownerMessage = this.buildOwnerMessage(
      request,
      message,
      approved,
      wasEdited
    );
    await sendEmail(request.ownerEmail, subject, ownerMessage);
  }
}

private buildOwnerMessage(
  request: IOrganizationRequest,
  baseMessage: string,
  approved: boolean,
  wasEdited: boolean
): string {
  return (
    `Dear ${request.ownerEmail.split("@")[0]},\n\n` +
    `You had been designated as the owner of organization "${
      request.organizationName
    }" which was just ${
      approved ? wasEdited ? "approved with some modifications" : "approved" : "rejected"
    } on TurfMania.\n\n` +
    (approved
      ? `As the owner, you have full administrative access to manage the organization.\n\n`
      : "") +
    baseMessage.substring(baseMessage.indexOf("\n\nIf you have any questions"))
  );
}

  // Reject request and notify requester
  public async rejectRequest(
    requestId: string,
    adminId: string,
    rejectionNotes: string
  ): Promise<IOrganizationRequest> {
    const request = await OrganizationRequest.findById(requestId);
    if (!request) {
      throw new ErrorResponse("Request not found", 404);
    }

    if (request.status !== "processing" && request.status !== "pending") {
      throw new ErrorResponse(
        "Request cannot be rejected in its current state",
        400
      );
    }

    request.status = "rejected";
    request.adminNotes = rejectionNotes;
    await request.save();

    // Notify requester
    await this.notifyRequestProcessed(request, false);

    return request;
  }

  public async getRequestById(
    requestId: string
  ): Promise<IOrganizationRequest> {
    const request = await OrganizationRequest.findById(requestId)
      .populate("requesterId", "first_name last_name email")
      .populate("processingAdminId", "first_name last_name email")
      .populate("organizationId");

    if (!request) {
      throw new ErrorResponse("Organization request not found", 404);
    }

    return request;
  }
}