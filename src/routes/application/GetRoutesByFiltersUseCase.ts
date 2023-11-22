import { MongoRouteModel } from "../infrastructure/mongoModel/MongoRouteModel.js";
import IRoute from "../domain/IRoute.js";

export default async function GetRoutesByFiltersUseCase(
  cityId: string,
  language: string,
  textSearch: string
): Promise<IRoute[]> {
  const query = {};
  if (cityId) {
    Object.assign(query, { cityId });
  }
  if (language) {
    Object.assign(query, { language: language.replace("_", "-") });
  }
  if (textSearch) {
    Object.assign(query, {
      $or: [
        { title: { $regex: textSearch, $options: "i" } },
        { description: { $regex: textSearch, $options: "i" } },
      ],
    });
  }
  return MongoRouteModel.find(query);
}
