import { IPlace } from "../../../places/domain/interfaces/IPlace.js";
import { ISearchResult } from "../interfaces/ISearchResult.js";

const getTranslation = (
  translations: { [key: string]: string },
  language: string
): string => {
  return translations[language] || Object.values(translations)[0] || "";
};

const getDistance = (
  coordinates1: number[],
  coordinates2: number[]
): number => {
  const R = 6371e3;
  const φ1 = (coordinates1[0] * Math.PI) / 180;
  const φ2 = (coordinates2[0] * Math.PI) / 180;
  const Δφ = ((coordinates2[0] - coordinates1[0]) * Math.PI) / 180;
  const Δλ = ((coordinates2[1] - coordinates1[1]) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

export function transformPlaceToSearchResult(
  place: IPlace,
  language: string,
  userCoordinates: number[]
): ISearchResult {
  const distance = getDistance(
    userCoordinates,
    place.address.coordinates.coordinates
  );
  return {
    id: place?._id?.toString() || "",
    name: getTranslation(place.nameTranslations, language),
    coordinates: place.address.coordinates,
    city: place.address.city
      ? getTranslation(place.address.city, language)
      : "",
    country: place.address.country
      ? getTranslation(place.address.country, language)
      : "",
    distance: distance,
    importance: place.importance,
    type: "place",
  };
}
