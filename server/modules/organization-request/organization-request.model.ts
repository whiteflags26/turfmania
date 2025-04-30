// organization-request.model.ts
import mongoose, { Document, Schema, Types } from "mongoose";
import { z } from "zod"; 

// Define Zod Schemas for validation
const bdPhoneSchema = z.string().regex(
  /^(?:\+88|88)?(01[3-9]\d{8})$/,
  { message: "Invalid Bangladeshi phone number (e.g. 01712345678 or +8801712345678)" }
);

const emailSchema = z.string().email({ message: "Invalid email address format" });

// TypeScript Types
export type RequestStatus = "pending" | "processing" | "approved" | "approved_with_changes" | "rejected";




export interface IOrganizationRequest extends Document {
  requesterId: Types.ObjectId;
  status: RequestStatus;
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
  adminNotes?: string;
  processingAdminId?: Types.ObjectId;
  processingStartedAt?: Date;
  orgContactPhone: string;
  orgContactEmail: string;
  images: string[];
  organizationId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose Schema
const OrganizationRequestSchema: Schema = new Schema(
  {
    requesterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "approved", "approved_with_changes", "rejected"],
      default: "pending",
    },
    organizationName: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    facilities: {
      type: [String],
      required: true,
      validate: {
        validator: (value: string[]) => value.length > 0,
        message: "At least one facility is required",
      },
    },
    location: {
      place_id: { type: String, required: true },
      address: { type: String, required: true },
      coordinates: {
        type: {
          type: String,
          enum: ["Point"],
          required: true,
          default: "Point",
        },
        coordinates: {
          type: [Number],
          required: true,
          validate: {
            validator: (value: number[]) => value.length === 2,
            message: "Coordinates must be an array of [longitude, latitude]",
          },
        },
      },
      area: String,
      sub_area: String,
      city: { type: String, required: true },
      post_code: String,
    },
    contactPhone: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: (value: string) => bdPhoneSchema.safeParse(value).success,
        message: "Please provide a valid Bangladeshi phone number (e.g. 01712345678 or +8801712345678)",
      },
    },
    ownerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: (value: string) => emailSchema.safeParse(value).success,
        message: "Please provide a valid owner email address",
      },
    },
    requestNotes: {
      type: String,
      trim: true,
    },
    adminNotes: {
      type: String,
      trim: true,
    },
    processingAdminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    processingStartedAt: {
      type: Date,
    },
    orgContactPhone: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: (value: string) => bdPhoneSchema.safeParse(value).success,
        message: "Please provide a valid Bangladeshi phone number (e.g. 01712345678 or +8801712345678)",
      },
    },
    orgContactEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: (value: string) => emailSchema.safeParse(value).success,
        message: "Please provide a valid organization contact email address",
      },
    },
    images: {
      type: [String],
      default: [],
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
    },
  },
  { timestamps: true }
);

// Indexes for performance
OrganizationRequestSchema.index({ status: 1, createdAt: -1 });
OrganizationRequestSchema.index({ requesterId: 1 });
OrganizationRequestSchema.index({ processingAdminId: 1 });
OrganizationRequestSchema.index({ "location.coordinates": "2dsphere" });
OrganizationRequestSchema.index({ ownerEmail: 1 });

// Model
const OrganizationRequest = mongoose.model<IOrganizationRequest>(
  "OrganizationRequest",
  OrganizationRequestSchema
);

export default OrganizationRequest;
