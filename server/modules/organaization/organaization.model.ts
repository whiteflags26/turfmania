import mongoose, { Document, Schema } from "mongoose";

interface IOrganization extends Document {
  name: string;
  facilities: string[];
  images: string[];
  turfs: mongoose.Types.ObjectId[];
}

const OrganizationSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    facilities: { type: [String], default: [] },
    images: { type: [String], default: [] },
    turfs: [{ type: Schema.Types.ObjectId, ref: "Turf" }],
  },
  { timestamps: true }
);

export const Organization = mongoose.model<IOrganization>(
  "Organization",
  OrganizationSchema
);
