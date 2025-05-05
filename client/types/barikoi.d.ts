export interface IBarikoiSuggestion {
  id: number;
  longitude: number;
  latitude: number;
  address: string;
  address_bn?: string;
  city: string;
  city_bn?: string;
  area: string;
  area_bn?: string;
  postCode?: number;
  pType?: string;
  uCode?: string;
}

export interface IBarikoiAutocompleteResponse {
  places: IBarikoiSuggestion[];
  status: number;
}