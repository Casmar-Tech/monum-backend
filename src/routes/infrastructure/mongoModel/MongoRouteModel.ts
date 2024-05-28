import { Model, model, Schema } from "mongoose";
import { IRoute, IRouteTranslated } from "../../domain/interfaces/IRoute.js";
import { MediaSchema } from "../../../medias/infrastructure/mongoModel/MongoMediaModel.js";
import { IStop } from "../../domain/interfaces/IStop.js";
import { PlaceSchema } from "../../../places/infrastructure/mongoModel/MongoPlaceModel.js";

const StopSchema = new Schema<IStop>({
  order: { type: Number, required: true },
  optimizedOrder: { type: Number },
  medias: { type: [MediaSchema], required: true },
  place: { type: PlaceSchema, required: true },
});

export const RouteSchema = new Schema<IRoute>(
  {
    title: {
      type: Object,
      of: String,
      required: true,
    },
    description: { type: Object, of: String, required: true },
    rating: { type: Number },
    stops: { type: [StopSchema], required: true },
    duration: { type: Number },
    optimizedDuration: { type: Number },
    distance: { type: Number },
    optimizedDistance: { type: Number },
    cityId: { type: Schema.Types.ObjectId, ref: "cities" },
    deleted: {
      type: Boolean,
      required: false,
      default: false,
    },
    deletedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: "users", required: true },
  },
  { timestamps: true }
);

RouteSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

RouteSchema.set("toJSON", { virtuals: true });
RouteSchema.set("toObject", { virtuals: true });

export async function createRouteFromSimpleRoute(
  route: IRouteTranslated,
  language: string
) {
  return await MongoRouteModel.create({
    title: {
      [language]: route.title,
    },
    description: {
      [language]: route.description,
    },
    rating: route.rating,
    stops: route.stops,
    duration: route.duration,
    optimizedDuration: route.optimizedDuration,
    distance: route.distance,
    optimizedDistance: route.optimizedDistance,
    cityId: route.cityId,
    createdBy: route.createdBy,
  });
}

export const MongoRouteModel = model("routes", RouteSchema);
