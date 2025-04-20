import { MongoRouteModel } from "../infrastructure/mongoModel/MongoRouteModel.js";
import { IRouteTranslated } from "../domain/interfaces/IRoute.js";
import GetUserByIdUseCase from "../../users/application/GetUserByIdUseCase.js";
import { getTranslatedRoute } from "../domain/functions/Route.js";

export default async function GetRoutesByFiltersUseCase(
  userId: string,
  cityId: string,
  textSearch: string
): Promise<IRouteTranslated[]> {
  const user = await GetUserByIdUseCase(userId);
  const userLanguage = user.language;
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
  const routes = await MongoRouteModel.find(query);
  return await Promise.all(
    routes.map(
      async (route) => await getTranslatedRoute(route.toObject(), userLanguage)
    )
  );
}
