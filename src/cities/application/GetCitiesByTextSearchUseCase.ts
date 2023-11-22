import ICity from "../domain/interfaces/ICity.js";
import { MongoCityModel } from "../infrastructure/mongoModel/MongoCityModel.js";

export default async function GetCitiesByTextSearchUseCase(
  textSearch: string
): Promise<ICity[]> {
  return await MongoCityModel.find({
    $or: [
      { "translations.es_ES": { $regex: textSearch, $options: "i" } },
      { "translations.en_US": { $regex: textSearch, $options: "i" } },
      { "translations.ca_ES": { $regex: textSearch, $options: "i" } },
      { "translations.fr_FR": { $regex: textSearch, $options: "i" } },
    ],
  });
}
