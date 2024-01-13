import { MongoPlaceModel } from "../infrastructure/mongoModel/MongoPlaceModel.js";
import { MongoPlaceSearchesModel } from "../infrastructure/mongoModel/MongoPlaceSearchesModel.js";
import IPlace from "../domain/interfaces/IPlace.js";
import { SortField, SortOrder } from "../domain/types/SortTypes.js";

export default async function GetPlacesUseCase(
  textSearch?: string,
  centerCoordinates?: [number, number],
  sortField?: SortField,
  sortOrder?: SortOrder
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
  if (sortField) {
    if (sortOrder === "asc") {
      return await MongoPlaceModel.find({
        name: { $regex: textSearch || "", $options: "i" },
      }).sort({ [sortField]: 1 });
    } else {
      return await MongoPlaceModel.find({
        name: { $regex: textSearch || "", $options: "i" },
      }).sort({ [sortField]: -1 });
    }
  }
  return await MongoPlaceModel.find({
    name: { $regex: textSearch || "", $options: "i" },
  });
}
