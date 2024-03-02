import { model, Schema } from "mongoose";
import { IPlaceSearches } from "../../domain/interfaces/IPlaceSearches.js";

export const PlaceSearchSchema = new Schema<IPlaceSearches>({
  textSearch: { type: String, required: true },
  centerCoordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
});

PlaceSearchSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

PlaceSearchSchema.set("toJSON", { virtuals: true });
PlaceSearchSchema.set("toObject", { virtuals: true });

export const MongoPlaceSearchesModel = model(
  "place-searches",
  PlaceSearchSchema
);
