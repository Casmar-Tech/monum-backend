import { MongoPlaceModel } from "../infrastructure/mongoModel/MongoPlaceModel.js";
import IPlace from "../domain/interfaces/IPlace.js";

export default async function GetAllPlacesUseCase(): Promise<IPlace[]> {
  return await MongoPlaceModel.find();
}
