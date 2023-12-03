import { model, Schema } from "mongoose";
import { IPlaceSearches } from "../../domain/interfaces/IPlaceSearches.js";

export const PlaceSearchSchema = new Schema<IPlaceSearches>({
  textSearch: { type: String, required: true },
  centerCoordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
});

export const MongoPlaceSearchesModel = model(
  "place-searches",
  PlaceSearchSchema
);
