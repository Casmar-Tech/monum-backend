import { model, Schema } from "mongoose";
import ICity from "../../domain/interfaces/ICity.js";

const Photo = {
  id: String,
  url: String,
  width: Number,
  height: Number,
};

const CitySchema = new Schema<ICity>({
  translations: {
    es_ES: { type: String, required: false },
    en_US: { type: String, required: true },
    ca_ES: { type: String, required: false },
    fr_FR: { type: String, required: false },
  },
  photo: { type: Photo },
});

export const MongoCityModel = model("cities", CitySchema);
