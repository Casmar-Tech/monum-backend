import { ApolloError } from "apollo-server-errors";
import GetRealPermissionsOfUser from "../../permissions/application/GetRealPermissionsOfUser.js";
import { ICityTranslated } from "../domain/interfaces/ICity.js";
import { MongoCityModel } from "../infrastructure/mongoModel/MongoCityModel.js";
import { MongoUserModel } from "../../users/infrastructure/mongoModel/MongoUserModel.js";
import { MongoOrganizationModel } from "../../organizations/infrastructure/mongoModel/MongoOrganizationModel.js";

export default async function GetCitiesFullByTextSearchUseCase(
  textSearch: string,
  userId: string,
  hasRoutes?: boolean
): Promise<ICityTranslated[]> {
  const user = await MongoUserModel.findById(userId);
  if (!user) {
    throw new ApolloError("User not found", "USER_NOT_FOUND");
  }
  const query = {
    deleted: { $ne: true },
    $or: [
      { "name.es_ES": { $regex: textSearch, $options: "i" } },
      { "name.en_US": { $regex: textSearch, $options: "i" } },
      { "name.ca_ES": { $regex: textSearch, $options: "i" } },
      { "name.fr_FR": { $regex: textSearch, $options: "i" } },
    ],
  };
  const permissions = await GetRealPermissionsOfUser(userId, "city", "read");
  const actionPermission = permissions.map((p) => p.action);
  if (actionPermission.includes("read:any")) {
  } else if (actionPermission.includes("read:own") && user.organizationId) {
    const organization = await MongoOrganizationModel.findById(
      user.organizationId
    );
    if (!organization) {
      throw new ApolloError("Organization not found", "ORGANIZATION_NOT_FOUND");
    }
    const citiesIds = organization.citiesIds;
    Object.assign(query, { _id: { $in: citiesIds } });
  } else {
    return [];
  }
  if (hasRoutes) {
    Object.assign(query, { hasRoutes: true });
  }
  const cities = await MongoCityModel.aggregate([
    {
      $lookup: {
        from: "routes",
        localField: "_id",
        foreignField: "cityId",
        as: "hasRoutes",
      },
    },
    {
      $addFields: {
        hasRoutes: {
          $cond: {
            if: {
              $gt: [
                {
                  $size: "$hasRoutes",
                },
                0,
              ],
            },
            then: true,
            else: false,
          },
        },
      },
    },
  ])
    .match(query)
    .limit(10);
  return cities;
}
