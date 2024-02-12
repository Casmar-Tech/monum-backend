import {
  MongoPlaceModel,
  PlaceSchema,
} from "../infrastructure/mongoModel/MongoPlaceModel.js";
import { MongoPlaceSearchesModel } from "../infrastructure/mongoModel/MongoPlaceSearchesModel.js";
import { IPlace, IPlaceTranslated } from "../domain/interfaces/IPlace.js";
import { SortField, SortOrder } from "../domain/types/SortTypes.js";
import { getTranslatedPlace } from "../domain/functions/Place.js";
import GetUserByIdUseCase from "../../users/application/GetUserByIdUseCase.js";
import { ImageSize } from "../domain/types/ImageTypes.js";

export default async function GetPlacesUseCase(
  userId: string,
  textSearch?: string,
  centerCoordinates?: [number, number],
  sortField?: SortField,
  sortOrder?: SortOrder,
  imageSize?: ImageSize
): Promise<IPlaceTranslated[]> {
  const user = await GetUserByIdUseCase(userId);
  const language = user.language;
  if (centerCoordinates && textSearch && textSearch !== "") {
    await MongoPlaceSearchesModel.create({
      centerCoordinates: {
        lat: centerCoordinates[1],
        lng: centerCoordinates[0],
      },
      textSearch,
    });
  }
  let places = [];
  let query = {
    deleted: { $ne: true },
    name: { $regex: textSearch || "", $options: "i" },
    [`nameTranslations.${language}`]: { $exists: true },
    [`description.${language}`]: { $exists: true },
    [`address.city.${language}`]: { $exists: true },
    [`address.country.${language}`]: { $exists: true },
    [`address.province.${language}`]: { $exists: true },
    [`address.street.${language}`]: { $exists: true },
  };
  const aggregation = [
    {
      $match: query,
    },
    {
      $lookup: {
        from: "medias",
        localField: "_id",
        foreignField: "placeId",
        as: "mediaDocs",
      },
    },
    {
      $addFields: {
        mediaCount: { $size: "$mediaDocs" },
      },
    },
    {
      $match: {
        mediaCount: { $gt: 0 },
      },
    },
    {
      $project: {
        mediaCount: 0,
        mediaDocs: 0,
      },
    },
  ];
  if (sortField) {
    places = await MongoPlaceModel.aggregate(aggregation).sort({
      [sortField]: sortOrder === "asc" ? 1 : -1,
    });
  } else {
    places = await MongoPlaceModel.aggregate(aggregation);
  }
  return await Promise.all(
    places.map(
      async (place) => await getTranslatedPlace(place, language, imageSize)
    )
  );
}
