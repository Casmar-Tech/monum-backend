import { MongoRouteModel } from "../infrastructure/mongoModel/MongoRouteModel.js";
import { IRoute } from "../domain/interfaces/IRoute.js";

export default async function GetRoutesFullByFiltersUseCase(
  cityId: string,
  textSearch: string,
  limit: number,
  offset: number
): Promise<{
  routes: IRoute[];
  total: number;
}> {
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
  const routes = await MongoRouteModel.find(query).skip(offset).limit(limit);
  const total = await MongoRouteModel.countDocuments(query);
  return {
    routes,
    total: total,
  };
}
