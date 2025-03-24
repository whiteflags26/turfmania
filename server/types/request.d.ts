import { Request } from "express";

export interface AuthenticatedRequest extends Request {
  user?: { id: string }; // Define the user property with an id
}

export interface RegisterBody {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role?: string;
}

export interface LoginBody {
  email: string;
  password: string;
}
