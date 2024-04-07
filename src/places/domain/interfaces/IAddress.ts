export interface IAddress {
  coordinates: {
    type: string;
    coordinates: number[];
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
  county?: {
    [key: string]: string;
  };
  country: {
    [key: string]: string;
  };
}

export interface IAddressTranslated
  extends Omit<
    IAddress,
    "street" | "city" | "province" | "county" | "country"
  > {
  street?: string;
  city: string;
  province?: string;
  county?: string;
  country: string;
}
