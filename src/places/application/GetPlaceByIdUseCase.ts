import { MongoPlaceModel } from "../infrastructure/mongoModel/MongoPlaceModel.js";
import { IPlaceSimplified } from "../domain/interfaces/IPlace.js";
import GetUserByIdUseCase from "../../users/application/GetUserByIdUseCase.js";
import { ApolloError } from "apollo-server-errors";

export default async function GetPlaceByIdUseCase(
  placeId: string,
  userId: string
): Promise<IPlaceSimplified> {
  const user = await GetUserByIdUseCase(userId);
  const place = await MongoPlaceModel.findById(placeId);
  if (!place) {
    throw new ApolloError("Place not found", "PLACE_NOT_FOUND");
  }
  return place?.getSimplifiedVersion(user.language);
}
