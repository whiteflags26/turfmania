export interface ITurf {
  _id: string;
  name: string;
  basePrice: number;
  sports: string[];
  team_size: number;
  images: string[];
  organization: {
    _id: string;
    name: string;
    location: {
      coordinates: {
        type: string;
        coordinates: number[];
      };
      place_id: string;
      address: string;
      area?: string;
      sub_area?: string;
      city: string;
      post_code?: string;
    };
  };
  operatingHours: {
    day: number;
    open: string;
    close: string;
  }[];
  reviews: string[];
  createdAt: string;
  updatedAt: string;
}
