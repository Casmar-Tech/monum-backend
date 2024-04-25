import { model, Schema } from "mongoose";
import { IGetPlaceHistory } from "../../domain/interfaces/IGetPlaceHistory.js";

export const GetPlaceHistorySchema = new Schema<IGetPlaceHistory>(
  {
    placeId: { type: Schema.Types.ObjectId, required: true, ref: "places" },
    isMobile: { type: Boolean, required: true },
    userId: { type: Schema.Types.ObjectId, required: true, ref: "users" },
    fromSupport: { type: String, required: true },
  },
  { timestamps: true }
);

export const MongoGetPlaceHistoryModel = model(
  "get-place-histories",
  GetPlaceHistorySchema
);
