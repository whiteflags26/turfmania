
import mongoose, { Document, Schema, Types } from 'mongoose';
import { PermissionScope } from '../permission/permission.model'; // Adjust path

export interface IUserRoleAssignment extends Document {
  userId: Types.ObjectId;
  roleId: Types.ObjectId;
  scope: PermissionScope; // Denormalized scope for easier querying
  scopeId?: Types.ObjectId; // Link to Organization or Event ID if scope requires it
}

const UserRoleAssignmentSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  roleId: {
    type: Schema.Types.ObjectId,
    ref: 'Role',
    required: true,
    index: true,
  },
  scope: { // Store the scope directly on the assignment for filtering
    type: String,
    enum: Object.values(PermissionScope),
    required: true,
    index: true,
  },
  scopeId: { // Context ID (e.g., Organization ID or Event ID)
    type: Schema.Types.ObjectId,
    required: function(this: IUserRoleAssignment) {
        // Required only if the scope is not global
        return this.scope === PermissionScope.ORGANIZATION || this.scope === PermissionScope.EVENT;
    },
    index: true,
    // No 'ref' needed here as the context depends on the 'scope' field
  },
}, { timestamps: true });

// Ensure a user cannot be assigned the exact same role in the same scope/context twice
UserRoleAssignmentSchema.index({ userId: 1, scopeId: 1 }, { unique: true }); // scopeId can be null for global

// Index for finding all assignments for a user
UserRoleAssignmentSchema.index({ userId: 1, scope: 1, scopeId: 1 });

const UserRoleAssignment = mongoose.model<IUserRoleAssignment>('UserRoleAssignment', UserRoleAssignmentSchema);

export default UserRoleAssignment;