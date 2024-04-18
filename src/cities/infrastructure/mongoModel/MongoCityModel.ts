import { model, Schema } from "mongoose";
import { ICity } from "../../domain/interfaces/ICity.js";

const Photo = {
  id: String,
  url: String,
  width: Number,
  height: Number,
};

const CitySchema = new Schema<ICity>({
  name: {
    es_ES: { type: String, required: false },
    en_US: { type: String, required: true },
    ca_ES: { type: String, required: false },
    fr_FR: { type: String, required: false },
  },
  province: {
    es_ES: { type: String, required: false },
    en_US: { type: String, required: true },
    ca_ES: { type: String, required: false },
    fr_FR: { type: String, required: false },
  },
  county: {
    es_ES: { type: String, required: false },
    en_US: { type: String, required: true },
    ca_ES: { type: String, required: false },
    fr_FR: { type: String, required: false },
  },
  country: {
    es_ES: { type: String, required: false },
    en_US: { type: String, required: true },
    ca_ES: { type: String, required: false },
    fr_FR: { type: String, required: false },
  },
  population: { type: Number },
  coordinates: {
    type: { type: String, default: "Point" },
    coordinates: {
      type: [Number],
      index: "2dsphere",
    },
  },
  photo: { type: Photo },
});

CitySchema.virtual("id").get(function () {
  return this._id.toHexString();
});

CitySchema.set("toJSON", { virtuals: true });
CitySchema.set("toObject", { virtuals: true });
CitySchema.index({ "coordinates.coordinates": "2dsphere" });

export const MongoCityModel = model("cities", CitySchema);
