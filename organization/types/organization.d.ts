export interface HasAccessRequest {
  hasAccess: boolean;
}

export interface ICoordinates {
  type: "Point";
  coordinates: [number, number];
}

export interface ILocation {
  place_id: string;
  address: string;
  coordinates: ICoordinates;
  area?: string;
  sub_area?: string;
  city: string;
  post_code?: string;
}

export interface IOrganization {
  _id: string;
  name: string;
  facilities: string[];
  images: string[];
  location: ILocation;
  orgContactPhone: string;
  orgContactEmail: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}
