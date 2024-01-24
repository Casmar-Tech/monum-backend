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

export interface IAddressTranslated
  extends Omit<IAddress, "street" | "city" | "province" | "country"> {
  street?: string;
  city: string;
  province?: string;
  country: string;
}
