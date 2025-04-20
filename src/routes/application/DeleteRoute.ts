import { MongoRouteModel } from "../infrastructure/mongoModel/MongoRouteModel.js";
import { ApolloError } from "apollo-server-errors";

export default async function DeleteRoute(id: string): Promise<boolean> {
  const route = await MongoRouteModel.findById(id);
  if (!route) {
    throw new ApolloError("Route not found", "ROUTE_NOT_FOUND");
  }
  route.deleted = true;
  route.deletedAt = new Date();
  await route.save();
  return true;
}
