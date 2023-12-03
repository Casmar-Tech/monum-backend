import { MongoPlaceModel } from "../infrastructure/mongoModel/MongoPlaceModel.js";
import { MongoPlaceSearchesModel } from "../infrastructure/mongoModel/MongoPlaceSearchesModel.js";
import IPlace from "../domain/interfaces/IPlace.js";

export default async function GetPlacesUseCase(
  textSearch?: string,
  centerCoordinates?: [number, number]
): Promise<IPlace[]> {
  if (centerCoordinates && textSearch && textSearch !== "") {
    await MongoPlaceSearchesModel.create({
      centerCoordinates: {
        lat: centerCoordinates[1],
        lng: centerCoordinates[0],
      },
      textSearch,
    });
  }
  return await MongoPlaceModel.find({
    name: { $regex: textSearch || "", $options: "i" },
  });
}
