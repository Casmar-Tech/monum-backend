import { model, Schema } from "mongoose";
import IRoute from "../../domain/IRoute.js";
import { MediaSchema } from "../../../medias/infrastructure/mongoModel/MongoMediaModel.js";
import IStop from "../../domain/IStop.js";

const StopSchema = new Schema<IStop>({
  order: { type: Number, required: true },
  optimizedOrder: { type: Number, required: true },
  media: { type: MediaSchema },
});

const RouteSchema = new Schema<IRoute>({
  title: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  rating: { type: Number },
  stops: [{ type: StopSchema, required: true }],
  duration: { type: Number, required: true },
  optimizedDuration: { type: Number, required: true },
  distance: { type: Number, required: true },
  optimizedDistance: { type: Number, required: true },
  cityId: { type: Schema.Types.ObjectId, ref: "cities" },
  language: { type: String, required: true },
});

export const MongoRouteModel = model("routes", RouteSchema);
