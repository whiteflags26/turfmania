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

export interface FilterOptions {
  minPrice?: string;
  maxPrice?: string;
  teamSize?: string;
  sports?: string | string[];
  facilities?: string | string[];
  preferredDay?: string;
  preferredTime?: string;
  latitude?: string;
  longitude?: string;
  radius?: string;
  page?: string;
  limit?: string;
}
