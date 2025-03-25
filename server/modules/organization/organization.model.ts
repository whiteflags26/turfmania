import mongoose, { Document, Schema } from "mongoose";

interface ILocation {
  place_id: string; // Unique identifier from Barikoi
  address: string; // Full formatted address
  coordinates: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  area?: string;
  sub_area?: string;
  city: string;
  post_code?: string;
}

export interface IOrganization extends Document {
  name: string;
  facilities: string[];
  owner:mongoose.Types.ObjectId;
  userRoles: Array<{
    user: mongoose.Types.ObjectId;
    role: 'owner' | 'manager' | 'staff';
  }>;
  permissions: Map<string, string[]>;
  images: string[];
  turfs: mongoose.Types.ObjectId[];
  location: ILocation;
}

const OrganizationSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    facilities: { type: [String], default: [] },
    images: { type: [String], default: [] },
    turfs: [{ type: Schema.Types.ObjectId, ref: "Turf" }],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userRoles: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        role: {
          type: String,
          enum: ['owner', 'manager', 'staff'],
          required: true,
        },
      },
    ],
    permissions: {
      type: Map,
      of: [String],
      default: () => new Map(),
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
  },
  { timestamps: true }
);

OrganizationSchema.index({ "location.coordinates": "2dsphere" });

const Organization = mongoose.model<IOrganization>(
  "Organization",
  OrganizationSchema
);

export default Organization;
