import { Types } from "mongoose";

export interface IPlaceSearches {
  _id?: Types.ObjectId;
  textSearch: string;
  centerCoordinates: {
    type: string;
    coordinates: number[];
  };
}
