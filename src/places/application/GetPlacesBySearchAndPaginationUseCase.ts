import { MongoPlaceModel } from "../infrastructure/mongoModel/MongoPlaceModel.js";
import {
  IPlaceTranslated,
  IPlacesSearchResults,
} from "../domain/interfaces/IPlace.js";
import { getTranslatedPlace } from "../domain/functions/Place.js";
import { MongoUserModel } from "../../users/infrastructure/mongoModel/MongoUserModel.js";
import { ApolloError } from "apollo-server-errors";
import { Languages } from "../../shared/Types.js";

export default async function GetPlaceBySearchAndPaginationUseCase(
  userId: string,
  textSearch: string,
  pageNumber: number,
  resultsPerPage: number,
  language?: Languages
): Promise<IPlacesSearchResults> {
  const skip = (pageNumber - 1) * resultsPerPage;
  const user = await MongoUserModel.findById(userId);
  if (!user) {
    throw new ApolloError("User not found", "USER_NOT_FOUND");
  }
  const userLanguage = language || user.language || "en_US";
  const query = {
    deleted: { $ne: true },
    $or: [
      { name: { $regex: textSearch || "", $options: "i" } },
      {
        $expr: {
          $gt: [
            {
              $size: {
                $filter: {
                  input: { $objectToArray: "$nameTranslations" },
                  cond: {
                    $regexMatch: {
                      input: "$$this.v",
                      regex: textSearch || "",
                      options: "i",
                    },
                  },
                },
              },
            },
            0,
          ],
        },
      },
    ],
  };
  const totalResults = await MongoPlaceModel.countDocuments(query);
  const totalPages = Math.ceil(totalResults / resultsPerPage);
  const places = await MongoPlaceModel.find(query)
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(resultsPerPage);

  const placesToReturn = await Promise.all(
    places.map(async (place) => {
      return getTranslatedPlace(place.toObject(), userLanguage || "en_US");
    })
  );
  return {
    places: placesToReturn,
    pageInfo: {
      totalPages: totalPages,
      currentPage: pageNumber,
      totalResults: totalResults,
    },
  };
}
