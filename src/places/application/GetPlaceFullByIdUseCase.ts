import { MongoPlaceModel } from "../infrastructure/mongoModel/MongoPlaceModel.js";
import { MongoGetPlaceHistoryModel } from "../infrastructure/mongoModel/MongoGetPlaceHistoryModel.js";
import { IPlace } from "../domain/interfaces/IPlace.js";
import { ApolloError } from "apollo-server-errors";
import { FromSupport } from "../domain/types/FromSupportTypes.js";
import { Types } from "mongoose";

export default async function GetPlaceFullByIdUseCase(
  userId: string,
  placeId: string,
  isMobile?: boolean,
  fromSupport?: FromSupport
): Promise<IPlace> {
  const place = await MongoPlaceModel.findById(placeId);
  if (!place) {
    throw new ApolloError("Place not found", "PLACE_NOT_FOUND");
  }
  await MongoGetPlaceHistoryModel.create({
    placeId: new Types.ObjectId(placeId),
    isMobile: isMobile || false,
    userId: new Types.ObjectId(userId),
    fromSupport: fromSupport || "map",
  });
  return place.toObject();
}
