import { MongoPlaceModel } from "../infrastructure/mongoModel/MongoPlaceModel.js";
import { IPlaceTranslated } from "../domain/interfaces/IPlace.js";
import { getTranslatedPlace } from "../domain/functions/Place.js";
import { MongoUserModel } from "../../users/infrastructure/mongoModel/MongoUserModel.js";
import { ApolloError } from "apollo-server-errors";

export default async function GetAllPlacesUseCase(
  userId: string
): Promise<IPlaceTranslated[]> {
  const user = await MongoUserModel.findById(userId);
  if (!user) {
    throw new ApolloError("User not found", "USER_NOT_FOUND");
  }
  const userLanguage = user.language;
  let places = [];
  let query = {
    deleted: { $ne: true },
    $and: [
      { [`description.${userLanguage}`]: { $exists: true } },
      { [`address.street.${userLanguage}`]: { $exists: true } },
      { [`address.country.${userLanguage}`]: { $exists: true } },
      { [`address.province.${userLanguage}`]: { $exists: true } },
      { [`address.city.${userLanguage}`]: { $exists: true } },
    ],
  };
  // const aggregation = [
  //   {
  //     $match: query,
  //   },
  //   {
  //     $lookup: {
  //       from: "medias",
  //       localField: "_id",
  //       foreignField: "placeId",
  //       as: "mediaDocs",
  //     },
  //   },
  //   {
  //     $addFields: {
  //       mediaCount: { $size: "$mediaDocs" },
  //     },
  //   },
  //   {
  //     $match: {
  //       mediaCount: { $gt: 0 },
  //     },
  //   },
  //   {
  //     $project: {
  //       mediaCount: 0,
  //       mediaDocs: 0,
  //     },
  //   },
  // ];
  // places = await MongoPlaceModel.aggregate(aggregation);
  places = await MongoPlaceModel.find(query);
  return await Promise.all(
    places.map(async (place) => {
      return await getTranslatedPlace(
        place.toObject(),
        userLanguage || "en_US"
      );
    })
  );
}
