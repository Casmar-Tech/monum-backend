export interface IAddress {
  coordinates: {
    lat: number;
    lng: number;
  };
  street?: {
    [key: string]: string;
  };
  city: {
    [key: string]: string;
  };
  postalCode?: string;
  province?: {
    [key: string]: string;
  };
  country: {
    [key: string]: string;
  };
}

export interface IAddressSimplified {
  coordinates: {
    lat: number;
    lng: number;
  };
  street?: string;
  city: string;
  postalCode?: string;
  province?: string;
  country: string;
}
