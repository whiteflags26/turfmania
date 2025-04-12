import bcrypt from 'bcryptjs';
import mongoose, { Types,Document, Schema } from 'mongoose';

export interface IRoleAssignment {
  role: Types.ObjectId; 
}


export interface UserDocument extends Document {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone_number?: string;
  user_roles: string[];
  isVerified: boolean;
  verificationToken: string;
  verificationTokenExpires: Date;
  reviews: mongoose.Types.ObjectId[];
  globalRoles: Types.ObjectId[];
  organizationRoles: Array<{ 
      organizationId: Types.ObjectId;
      role: Types.ObjectId; 
  }>;
  eventRoles: Array<{ 
      eventId: Types.ObjectId;
      role: Types.ObjectId; 
  }>;
}

const UserSchema = new Schema<UserDocument>(
  {
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, minlength: 6, select: false, required: true },
    phone_number: { type: String },
    user_roles: { type: [String], required: true, default: ['user'] },
    isVerified: { type: Boolean, default: false }, // Default to false
    verificationToken: { type: String }, // Token for email verification
    verificationTokenExpires: { type: Date }, 
    // Token expiration time
    globalRoles: [{
      type: Schema.Types.ObjectId,
      ref: 'Role',
  }],
  organizationRoles: [{
      _id: false, // Don't create a separate _id for this subdocument array element
      organizationId: {
          type: Schema.Types.ObjectId,
          ref: 'Organization', // Optional: Reference the Organization model
          required: true,
      },
      role: {
          type: Schema.Types.ObjectId,
          ref: 'Role',
          required: true,
      }
  }],
  eventRoles: [{
      _id: false,
      eventId: {
          type: Schema.Types.ObjectId,
          // ref: 'Event', // Optional: Reference your Event model if you have one
          required: true,
      },
      role: {
          type: Schema.Types.ObjectId,
          ref: 'Role',
          required: true,
      }
  }],
    reviews: [{
      type: Schema.Types.ObjectId,
      ref: "TurfReview",
    }],
  },
  { timestamps: true },
);

// hash the password before creating the database
UserSchema.pre<UserDocument>('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

const User =
  mongoose.models.User || mongoose.model<UserDocument>('User', UserSchema);

export default User;
