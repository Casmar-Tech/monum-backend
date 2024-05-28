import { MongoRouteModel } from "../infrastructure/mongoModel/MongoRouteModel.js";
import { IRoute, IRouteTranslated } from "../domain/interfaces/IRoute.js";
import GetUserByIdUseCase from "../../users/application/GetUserByIdUseCase.js";
import { getTranslatedRoute } from "../domain/functions/Route.js";

export default async function GetRoutesFullByFiltersUseCase(
  userId: string,
  cityId: string,
  textSearch: string,
  limit: number,
  offset: number,
  language: string
): Promise<{
  routes: IRouteTranslated[];
  total: number;
}> {
  const user = await GetUserByIdUseCase(userId);
  const userLanguage = language || user.language;
  const query = { deleted: { $ne: true } };
  if (cityId) {
    Object.assign(query, { cityId });
  }
  if (textSearch) {
    Object.assign(query, {
      $or: [
        { title: { $regex: textSearch, $options: "i" } },
        { description: { $regex: textSearch, $options: "i" } },
      ],
    });
  }
  const routes = await MongoRouteModel.find(query)
    .skip(offset)
    .limit(limit)
    .lean();
  const total = await MongoRouteModel.countDocuments(query);
  return {
    routes: await Promise.all(
      routes.map(async (route) => {
        return await getTranslatedRoute(route, userLanguage);
      })
    ),
    total: total,
  };
}
