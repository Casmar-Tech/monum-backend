import { MongoPlaceModel } from "../infrastructure/mongoModel/MongoPlaceModel.js";
import { MongoGetPlaceHistoryModel } from "../infrastructure/mongoModel/MongoGetPlaceHistoryModel.js";
import { IPlaceTranslated } from "../domain/interfaces/IPlace.js";
import GetUserByIdUseCase from "../../users/application/GetUserByIdUseCase.js";
import { ApolloError } from "apollo-server-errors";
import { ImageSize } from "../domain/types/ImageTypes.js";
import { getTranslatedPlace } from "../domain/functions/Place.js";
import { FromSupport } from "../domain/types/FromSupportTypes.js";
import { Types } from "mongoose";

export default async function GetPlaceByIdUseCase(
  userId: string,
  placeId: string,
  imageSize: ImageSize,
  language?: string,
  isMobile?: boolean,
  fromSupport?: FromSupport
): Promise<IPlaceTranslated> {
  let userLanguage = language;
  if (!userLanguage) {
    const user = await GetUserByIdUseCase(userId);
    userLanguage = user.language;
  }
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
  return getTranslatedPlace(
    place.toObject(),
    userLanguage || "en_US",
    imageSize
  );
}
