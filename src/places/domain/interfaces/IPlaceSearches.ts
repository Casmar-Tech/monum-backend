import { Types } from "mongoose";

export interface IPlaceSearches {
  _id?: Types.ObjectId;
  textSearch: string;
  centerCoordinates: {
    lat: number;
    lng: number;
  };
}
