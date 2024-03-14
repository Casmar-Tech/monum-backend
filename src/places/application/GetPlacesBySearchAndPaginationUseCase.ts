import { MongoPlaceModel } from "../infrastructure/mongoModel/MongoPlaceModel.js";
import { IPlaceTranslated } from "../domain/interfaces/IPlace.js";
import { getTranslatedPlace } from "../domain/functions/Place.js";
import { MongoUserModel } from "../../users/infrastructure/mongoModel/MongoUserModel.js";
import { ApolloError } from "apollo-server-errors";

export default async function GetPlaceBySearchAndPaginationUseCase(
  userId: string,
  searchText: string,
  pageNumber: number,
  resultsPerPage: number
): Promise<IPlaceTranslated[]> {
  const skip = (pageNumber - 1) * resultsPerPage;
  const user = await MongoUserModel.findById(userId);
  if (!user) {
    throw new ApolloError("User not found", "USER_NOT_FOUND");
  }
  const userLanguage = user.language;
  let query = {
    deleted: { $ne: true },
    $and: [
      { [`description.${userLanguage}`]: { $exists: true } },
      { [`address.street.${userLanguage}`]: { $exists: true } },
      { [`address.country.${userLanguage}`]: { $exists: true } },
      { [`address.province.${userLanguage}`]: { $exists: true } },
      { [`address.city.${userLanguage}`]: { $exists: true } },
      { name: { $regex: `.*${searchText}.*`, $options: "i" } },
    ],
  };
  const totalResults = await MongoPlaceModel.countDocuments(query);
  const totalPages = Math.ceil(totalResults / resultsPerPage);
  const places = await MongoPlaceModel.find(query)
    .sort({ updatedAt: 1 })
    .skip(skip)
    .limit(resultsPerPage);

  const placesToReturn = await Promise.all(
    places.map(async (place) => {
      return await getTranslatedPlace(
        place.toObject(),
        userLanguage || "en_US"
      );
    })
  );
  return placesToReturn;
}
