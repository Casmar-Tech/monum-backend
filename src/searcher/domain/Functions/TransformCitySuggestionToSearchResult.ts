import { ISearchResult } from "../interfaces/ISearchResult.js";
import ICitySuggestion from "../interfaces/ICitySuggestion.js";
import { MongoPlaceModel } from "../../../places/infrastructure/mongoModel/MongoPlaceModel.js";
import { Languages } from "../../../shared/Types.js";

export default async function TransformCitySuggestionToSearchResult(
  citySuggestion: ICitySuggestion,
  language: Languages
): Promise<ISearchResult> {
  const places = await MongoPlaceModel.find({
    $and: [
      {
        $or: [
          {
            "address.city.ca_ES": citySuggestion.name,
          },
          {
            "address.city.es_ES": citySuggestion.name,
          },
          {
            "address.city.en_US": citySuggestion.name,
          },
          {
            "address.city.fr_FR": citySuggestion.name,
          },
        ],
      },
      { deleted: { $ne: true } },
    ],
  });
  const numberOfPlaces = places.length;
  let placeCountry;
  let placeRegion;
  if (numberOfPlaces === 0) {
    const placesForCountry = await MongoPlaceModel.find({
      $and: [
        {
          $or: [
            {
              "address.country.ca_ES": citySuggestion.country,
            },
            {
              "address.country.es_ES": citySuggestion.country,
            },
            {
              "address.country.en_US": citySuggestion.country,
            },
            {
              "address.country.fr_FR": citySuggestion.country,
            },
          ],
        },
        { deleted: { $ne: true } },
      ],
    }).limit(1);
    if (placesForCountry[0]) {
      placeCountry = placesForCountry[0].address.country[language];
    }

    const placesForRegion = await MongoPlaceModel.find({
      $and: [
        {
          $or: [
            {
              "address.province.ca_ES": citySuggestion.region,
            },
            {
              "address.province.es_ES": citySuggestion.region,
            },
            {
              "address.province.en_US": citySuggestion.region,
            },
            {
              "address.province.fr_FR": citySuggestion.region,
            },
          ],
        },
        { deleted: { $ne: true } },
      ],
    }).limit(1);
    if (placesForRegion[0]) {
      placeRegion = placesForRegion[0].address.province?.[language];
    }
  }
  const country = places[0]
    ? places[0].address.country[language]
    : placeCountry || citySuggestion.country || "";
  const region =
    places[0] && places[0].address?.province
      ? places[0].address?.province[language]
      : placeRegion || citySuggestion.region;
  const name = places[0]
    ? places[0].address.city[language]
    : citySuggestion.namePreferred || citySuggestion.name;
  return {
    id: citySuggestion.id,
    name,
    country,
    region,
    coordinates: {
      coordinates: citySuggestion.coordinates,
      type: "Point",
    },
    city: name,
    distance: citySuggestion.distance,
    hasMonums: numberOfPlaces > 0,
    type: "city",
  };
}
