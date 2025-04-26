export interface ISearchResult {
  id: string;
  name?: string;
  country: string;
  region?: string;
  coordinates: {
    type: string;
    coordinates: number[];
  };
  city: string;
  distance: number;
  importance?: number;
  hasMonums?: boolean;
  type: "place" | "city";
}
