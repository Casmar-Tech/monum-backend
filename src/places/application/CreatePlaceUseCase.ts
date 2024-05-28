import { ApolloError } from "apollo-server-errors";
import { IPlaceTranslated } from "../domain/interfaces/IPlace.js";
import { createPlaceFromTranslatedPlace } from "../infrastructure/mongoModel/MongoPlaceModel.js";
import GetUserByIdUseCase from "../../users/application/GetUserByIdUseCase.js";
import { getTranslatedPlace } from "../domain/functions/Place.js";

export default async function CreatePlaceUseCase(
  userId: string,
  place: IPlaceTranslated
): Promise<IPlaceTranslated> {
  const user = await GetUserByIdUseCase(userId);
  const placeCreated = await createPlaceFromTranslatedPlace(
    place,
    user.language
  );
  if (placeCreated) {
    return getTranslatedPlace(placeCreated, user.language);
  }
  throw new ApolloError("Place not created", "PLACE_NOT_CREATED");
}
