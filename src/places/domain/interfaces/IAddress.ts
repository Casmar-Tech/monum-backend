export default interface IAddress {
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
