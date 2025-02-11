import mongoose, { Schema, Document } from "mongoose";

export interface TokenDocument extends Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  createdAt: Date;
}

const tokenSchema = new Schema<TokenDocument>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  token: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 }, // Token expires in 10 minutes
});

const Token = mongoose.model<TokenDocument>("Token", tokenSchema);

export default Token;
