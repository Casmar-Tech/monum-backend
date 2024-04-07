export default interface ICitySuggestion {
  id: string;
  name: string;
  namePreferred?: string;
  country?: string;
  region?: string;
  coordinates: number[];
  distance: number;
}
