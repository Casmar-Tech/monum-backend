import { Languages } from "../../shared/Types.js";
import { ICityWithDistance } from "../domain/interfaces/ICity.js";
import { MongoCityModel } from "../infrastructure/mongoModel/MongoCityModel.js";
import { getTranslatedCity } from "../domain/functions/City.js";

export default async function GetCitiesByTextSearchAndSortedByDistance(
  textSearch: string,
  originPoint: [number, number],
  language?: Languages,
  limit?: number
): Promise<ICityWithDistance[]> {
  const query = {
    deleted: { $ne: true },
    $or: [
      { "name.es_ES": { $regex: textSearch, $options: "i" } },
      { "name.en_US": { $regex: textSearch, $options: "i" } },
      { "name.ca_ES": { $regex: textSearch, $options: "i" } },
      { "name.fr_FR": { $regex: textSearch, $options: "i" } },
    ],
  };
  const cities = await MongoCityModel.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: originPoint,
        },
        distanceField: "distance",
        spherical: true,
      },
    },
    {
      $match: query,
    },
  ]);
  return cities.slice(0, limit || 10).map((city) => ({
    ...getTranslatedCity(city, language || "en_US"),
    distance: city.distance,
  }));
}
