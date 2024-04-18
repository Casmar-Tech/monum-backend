import { ICity, ICityTranslated } from "../interfaces/ICity.js";

const getTranslation = (
  translations: { [key: string]: string },
  language: string
): string => {
  return translations[language] || Object.values(translations)[0] || "";
};

export function getTranslatedCity(
  city: ICity,
  language: string
): ICityTranslated {
  return {
    ...city,
    id: city._id.toString(),
    name: getTranslation(city.name, language),
    province: getTranslation(city.province, language),
    county: getTranslation(city.county, language),
    country: getTranslation(city.country, language),
  };
}
