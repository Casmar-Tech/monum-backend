import { ApolloError } from "apollo-server-errors";
import { MongoPlaceModel } from "../infrastructure/mongoModel/MongoPlaceModel.js";

export default async function GetOrganizationIdOfAPlace(
  placeId: string
): Promise<string> {
  const place = await MongoPlaceModel.findById(placeId);
  if (!place) {
    throw new ApolloError("Place not found", "PLACE_NOT_FOUND");
  }
  if (!place.organizationId) {
    throw new ApolloError("Organization not found", "ORGANIZATION_NOT_FOUND");
  }
  return place.organizationId?.toString();
}
