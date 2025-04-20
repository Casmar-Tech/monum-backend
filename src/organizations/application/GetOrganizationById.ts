import { ApolloError } from "apollo-server-errors";
import { IOrganizationTranslated } from "../domain/interfaces/IOrganization.js";
import { MongoOrganizationModel } from "../infrastructure/mongoModel/MongoOrganizationModel.js";
import { getTranslatedOrganization } from "../domain/functions/Organization.js";
import { Languages } from "../../shared/Types.js";
import { MongoUserModel } from "../../users/infrastructure/mongoModel/MongoUserModel.js";

export default async function GetOrganizationById(
  userId: string,
  id: string,
  language: Languages
): Promise<IOrganizationTranslated> {
  const user = await MongoUserModel.findById(userId).lean();
  if (!user) {
    throw new ApolloError("User not found", "USER_NOT_FOUND");
  }
  const userLanguage = language || user.language;
  const organization = await MongoOrganizationModel.findById(id).lean();
  if (!organization) {
    throw new ApolloError("Organization not found", "ORGANIZATION_NOT_FOUND");
  }
  return getTranslatedOrganization(organization, userLanguage);
}
