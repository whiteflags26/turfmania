import mongoose, { Document, Schema } from "mongoose";

export interface ITeamSize extends Document {
  name: string;
}

const TeamSizeSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
  },
  { timestamps: true }
);

export const TeamSize = mongoose.model<ITeamSize>("TeamSize", TeamSizeSchema);