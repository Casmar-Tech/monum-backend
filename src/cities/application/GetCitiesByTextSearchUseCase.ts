import { ApolloError } from "apollo-server-errors";
import GetRealPermissionsOfUser from "../../permissions/application/GetRealPermissionsOfUser.js";
import { ICityTranslated } from "../domain/interfaces/ICity.js";
import { MongoCityModel } from "../infrastructure/mongoModel/MongoCityModel.js";
import { MongoUserModel } from "../../users/infrastructure/mongoModel/MongoUserModel.js";
import { MongoOrganizationModel } from "../../organizations/infrastructure/mongoModel/MongoOrganizationModel.js";
import { getTranslatedCity } from "../domain/functions/City.js";

export default async function GetCitiesByTextSearchUseCase(
  textSearch: string,
  userId: string,
  language?: string
): Promise<ICityTranslated[]> {
  const user = await MongoUserModel.findById(userId);
  if (!user) {
    throw new ApolloError("User not found", "USER_NOT_FOUND");
  }
  const userLanguage = language || user.language;
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
  const cities = await MongoCityModel.find(query);
  return cities.map((city) => getTranslatedCity(city.toObject(), userLanguage));
}
