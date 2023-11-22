import { MongoPlaceModel } from "../infrastructure/mongoModel/MongoPlaceModel.js";
import IPlace from "../domain/interfaces/IPlace.js";

export default async function GetPlaceByIdUseCase(
  placeId: string
): Promise<IPlace | null> {
  return await MongoPlaceModel.findById(placeId);
}
