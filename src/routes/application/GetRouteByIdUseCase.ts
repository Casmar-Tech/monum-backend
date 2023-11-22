import { MongoRouteModel } from "../infrastructure/mongoModel/MongoRouteModel.js";
import { ApolloError } from "apollo-server-errors";

interface GetRouteByIdDTO {
  id: string;
}

export default async function GetRouteByIdUseCase({ id }: GetRouteByIdDTO) {
  const route = await MongoRouteModel.findById(id);
  if (!route) {
    throw new ApolloError(
      `Route with id ${id} does not exist`,
      "ROUTE_NOT_FOUND"
    );
  } else if (!route.stops || !Array.isArray(route.stops)) {
    throw new ApolloError(
      `Route with id ${id} does not have stops`,
      "ROUTE_WITH_NO_STOPS"
    );
  }
  return route;
}
