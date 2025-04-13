export interface ITurf {
  _id: string;
  organization: {
    _id: string;
    name: string;
    location: {
      address: string;
      city: string;
    };
  };
  name: string;
  basePrice: number;
  sports: string[];
  team_size: number;
  images: string[];
  operatingHours: Array<{
    day: number;
    open: string;
    close: string;
  }>;
}
