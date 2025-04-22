import { ITurf } from "./turf";
import { IUser } from "./user";

export interface ITurfReview {
  _id: string;
  turf: ITurf | string;
  user: IUser ;
  rating: number;
  review?: string;
  images?: string[];
  createdAt: string;
  updatedAt: string;
}
