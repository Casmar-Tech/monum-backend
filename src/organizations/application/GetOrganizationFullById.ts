import { ApolloError } from "apollo-server-errors";
import { MongoOrganizationModel } from "../infrastructure/mongoModel/MongoOrganizationModel.js";
import { IOrganization } from "../domain/interfaces/IOrganization.js";

export default async function GetOrganizationFullById(
  id: string
): Promise<IOrganization> {
  const organization = await MongoOrganizationModel.findById(id).lean();
  if (!organization) {
    throw new ApolloError("Organization not found", "ORGANIZATION_NOT_FOUND");
  }
  return organization;
}
