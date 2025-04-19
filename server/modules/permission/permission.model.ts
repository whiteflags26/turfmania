import mongoose, { Document, Schema } from 'mongoose';

export enum PermissionScope {
  GLOBAL = 'global',
  ORGANIZATION = 'organization',
  EVENT = 'event',
}

export interface IPermission extends Document {
  name: string; // e.g., 'create_organization', 'manage_organization_roles', 'view_turf'
  description?: string;
  scope: PermissionScope;
}

const PermissionSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true, // Permissions names should be unique
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  scope: {
    type: String,
    enum: Object.values(PermissionScope),
    required: true,
  },
});

const Permission = mongoose.model<IPermission>('Permission', PermissionSchema);
export default Permission;