import { model, Schema, Types } from "mongoose";
import IMedia from "../../domain/IMedia.js";
import { PlaceSchema } from "../../../places/infrastructure/mongoModel/MongoPlaceModel.js";

export const MediaSchema = new Schema<IMedia>({
  place: { type: PlaceSchema, required: true },
  title: { type: String, required: true },
  text: { type: String, required: true },
  language: { type: String, required: true },
  rating: { type: Number, required: true },
  audioUrl: { type: String, required: true },
  voiceId: { type: String, required: true },
  duration: { type: Number },
});

export const MongoMediaModel = model("medias", MediaSchema);
