import { Types } from 'mongoose';

export interface ICreateTurfData {
  name: string;
  organization: Types.ObjectId;
  sports: string[];
  team_size: number;
  basePrice: number;
  operatingHours: {
    day: number;
    open: string;
    close: string;
  }[];
  images: string[];
  description?: string;
  status?: 'active' | 'inactive';
  reviews?: Types.ObjectId[];
}
