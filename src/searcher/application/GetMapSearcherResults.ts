import { MongoPlaceModel } from "../../places/infrastructure/mongoModel/MongoPlaceModel.js";
import { transformPlaceToSearchResult } from "../domain/Functions/TransformPlaceToPlaceSearchResult.js";
import { MongoUserModel } from "../../users/infrastructure/mongoModel/MongoUserModel.js";
import { ApolloError } from "apollo-server-errors";
import { ISearchResult } from "../domain/interfaces/ISearchResult.js";
import GetCitiesByTextSearchAndSortedByDistance from "../../cities/application/GetCitiesByTextSearchAndSortedByDistance.js";
import TransformCitySuggestionToSearchResult from "../domain/Functions/TransformCitySuggestionToSearchResult.js";

interface GetMapSearcherResultsInput {
  textSearch?: string;
  coordinates: [number, number];
  userId: string;
}

export default async function GetMapSearcherResults({
  textSearch,
  coordinates,
  userId,
}: GetMapSearcherResultsInput): Promise<ISearchResult[]> {
  const user = await MongoUserModel.findById(userId);
  if (!user) throw new ApolloError("User not found", "USER_NOT_FOUND");
  const { language } = user;
  const placesOrdered = await MongoPlaceModel.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [coordinates[0], coordinates[1]],
        },
        distanceField: "distance",
        spherical: true,
      },
    },
    {
      $match: {
        $and: [
          {
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
          },
          {
            [`description.${language}`]: { $exists: true },
            [`address.city.${language}`]: { $exists: true },
            [`address.country.${language}`]: { $exists: true },
            [`address.province.${language}`]: { $exists: true },
            [`address.street.${language}`]: { $exists: true },
          },
          {
            deleted: { $ne: true },
          },
          { photos: { $exists: true, $not: { $size: 0 } } },
        ],
      },
    },

    { $sort: { distance: 1 } },
  ]).limit(20);
  const placesSearchResult = placesOrdered.map((place) =>
    transformPlaceToSearchResult(place, language, coordinates)
  );
  const cities =
    textSearch && textSearch.length > 0
      ? await GetCitiesByTextSearchAndSortedByDistance(
          textSearch,
          coordinates,
          language
        )
      : [];
  const citiesSearchResult = await Promise.all(
    cities.map(
      async (city) =>
        await TransformCitySuggestionToSearchResult(city, language)
    )
  );
  const searchResult = [...placesSearchResult, ...citiesSearchResult]
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 10);
  return searchResult;
}
