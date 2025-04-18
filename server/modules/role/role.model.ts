import mongoose, { Document, Schema, Types } from 'mongoose';
import { PermissionScope } from '../permission/permission.model';

export interface IRole extends Document {
  name: string; // e.g., 'Admin', 'Organization Owner', 'Event Manager', 'Staff'
  scope: PermissionScope;
 
  permissions: Types.ObjectId[]; // References Permission documents
  isDefault: boolean; // Flag for default roles like 'Admin' or 'Organization Owner'
}

const RoleSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    scope: {
      type: String,
      enum: Object.values(PermissionScope),
      required: true,
    },

    permissions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Permission',
      },
    ],
    isDefault: {
      // To identify roles like 'Admin', 'Organization Owner'
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// Index to ensure role names are unique within their scope (global or specific org/event)
RoleSchema.index({ name: 1, scope: 1 }, { unique: true });

const Role = mongoose.model<IRole>('Role', RoleSchema);
export default Role;
