import { MongoPlaceModel } from "../infrastructure/mongoModel/MongoPlaceModel.js";
import { MongoPlaceSearchesModel } from "../infrastructure/mongoModel/MongoPlaceSearchesModel.js";
import { IPlaceTranslated } from "../domain/interfaces/IPlace.js";
import { SortField, SortOrder } from "../domain/types/SortTypes.js";
import { getTranslatedPlace } from "../domain/functions/Place.js";
import { ImageSize } from "../domain/types/ImageTypes.js";
import { Languages } from "../../shared/Types.js";
import GetRealPermissionsOfUser from "../../permissions/application/GetRealPermissionsOfUser.js";
import { MongoUserModel } from "../../users/infrastructure/mongoModel/MongoUserModel.js";
import { ApolloError } from "apollo-server-errors";

export default async function GetPlacesUseCase(
  userId: string,
  textSearch?: string,
  centerCoordinates?: [number, number],
  sortField?: SortField,
  sortOrder?: SortOrder,
  imageSize?: ImageSize,
  language?: Languages
): Promise<IPlaceTranslated[]> {
  const user = await MongoUserModel.findById(userId);
  if (!user) {
    throw new ApolloError("User not found", "USER_NOT_FOUND");
  }
  const userLanguage = language || user.language;
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
    [`description.${userLanguage}`]: { $exists: true },
    [`address.city.${userLanguage}`]: { $exists: true },
    [`address.country.${userLanguage}`]: { $exists: true },
    [`address.province.${userLanguage}`]: { $exists: true },
    [`address.street.${userLanguage}`]: { $exists: true },
  };
  const permissions = await GetRealPermissionsOfUser(userId, "place", "read");
  const actionPermission = permissions.map((p) => p.action);
  if (actionPermission.includes("read:any:any")) {
    query = {
      ...query,
    };
  } else if (actionPermission.includes("read:any:own") && user.organizationId) {
    Object.assign(query, {
      organizationId: user.organizationId,
    });
  } else if (actionPermission.includes("read:own")) {
    Object.assign(query, {
      userId,
    });
  } else {
    return [];
  }
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
      async (place) =>
        await getTranslatedPlace(place, userLanguage || "en_US", imageSize)
    )
  );
}
