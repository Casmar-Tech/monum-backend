import { Languages } from "../../shared/Types.js";
import GetUserByIdUseCase from "../../users/application/GetUserByIdUseCase.js";
import { getTranslatedRoute } from "../domain/functions/Route.js";
import { IRouteTranslated } from "../domain/interfaces/IRoute.js";
import { MongoRouteModel } from "../infrastructure/mongoModel/MongoRouteModel.js";
import { ApolloError } from "apollo-server-errors";

export default async function GetRouteByIdUseCase(
  userId: string,
  id: string,
  language?: Languages
): Promise<IRouteTranslated> {
  const route = await MongoRouteModel.findById(id);
  const user = await GetUserByIdUseCase(userId);
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
  return getTranslatedRoute(route.toObject(), user.language);
}
