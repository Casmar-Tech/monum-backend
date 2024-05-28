import { ApolloError } from "apollo-server-errors";
import { UpdateRouteFullInput } from "../infrastructure/graphql/resolvers";

export default async function UpdateRoute(
  userId: string,
  id: string,
  routeUpdate: UpdateRouteFullInput
): Promise<boolean> {
  return true;
}
