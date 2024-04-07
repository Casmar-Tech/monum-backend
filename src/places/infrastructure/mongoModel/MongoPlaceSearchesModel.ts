import { model, Schema } from "mongoose";
import { IPlaceSearches } from "../../domain/interfaces/IPlaceSearches.js";

export const PlaceSearchSchema = new Schema<IPlaceSearches>({
  textSearch: { type: String, required: true },
  centerCoordinates: {
    type: { type: String, enum: ["Point"], required: true },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
});

PlaceSearchSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

PlaceSearchSchema.set("toJSON", { virtuals: true });
PlaceSearchSchema.set("toObject", { virtuals: true });
PlaceSearchSchema.index({ centerCoordinates: "2dsphere" });

export const MongoPlaceSearchesModel = model(
  "place-searches",
  PlaceSearchSchema
);
