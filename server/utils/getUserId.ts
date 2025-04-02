import { AuthenticatedRequest } from "../types/request";

// Get the user ID from the request object(AuthenticatedRequest)

export const getUserId = (req: AuthenticatedRequest): string => {
  if (!req.user?.id) {
    throw new Error("Authentication required");
  }
  return req.user.id;
};
