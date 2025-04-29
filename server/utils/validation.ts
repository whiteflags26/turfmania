import mongoose from 'mongoose';

import { z } from 'zod';

// Create a custom Zod type for MongoDB ObjectId
export const ObjectIdSchema = z
  .string()
  .refine(val => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid ObjectID format',
  });

// Type for validated ObjectId
export type ValidatedObjectId = z.infer<typeof ObjectIdSchema>;

// Validation helper function
export const validateId = (id: unknown): ValidatedObjectId => {
  return ObjectIdSchema.parse(id);
};


export const isValidMongoId = (id: unknown): boolean => {
  if (typeof id !== 'string') return false;
  return mongoose.Types.ObjectId.isValid(id);
};