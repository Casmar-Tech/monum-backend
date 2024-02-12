import { IPlace, IPlaceTranslated } from "../domain/interfaces/IPlace.js";
import { MongoPlaceModel } from "../infrastructure/mongoModel/MongoPlaceModel.js";
import GetUserByIdUseCase from "../../users/application/GetUserByIdUseCase.js";
import { ApolloError } from "apollo-server-errors";
import { getTranslatedPlace } from "../domain/functions/Place.js";

export default async function UpdatePlaceUseCase(
  userId: string,
  placeId: string,
  placeUpdate: Partial<IPlace>
): Promise<IPlaceTranslated> {
  const user = await GetUserByIdUseCase(userId);
  const placeUpdated = await MongoPlaceModel.findByIdAndUpdate(
    placeId,
    placeUpdate,
    { new: true }
  );
  if (placeUpdated) {
    return getTranslatedPlace(placeUpdated, user.language);
  }
  throw new ApolloError("Place not found", "PLACE_NOT_FOUND");
}
