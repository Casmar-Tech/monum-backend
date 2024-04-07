import { Languages } from "../../../shared/Types.js";
import ICitySuggestion from "../../domain/interfaces/ICitySuggestion.js";

const apiUrlSuggestion = "https://api.mapbox.com/search/searchbox/v1/suggest";
const apiUrlRetrieve = "https://api.mapbox.com/search/searchbox/v1/retrieve";
const token =
  "pk.eyJ1IjoibW9udW0iLCJhIjoiY2x1cGNydm4wMDJydzJpcXFzOGV5c2U0NiJ9.uH-MoEW-Nmu5cwRkuqH1sQ";

interface GetCitiesProps {
  textSearch: string;
  coordinates: number[];
  language: Languages;
}

export default async function GetCities({
  textSearch,
  coordinates,
  language,
}: GetCitiesProps): Promise<ICitySuggestion[]> {
  let languageMapbox;
  switch (language) {
    case "es_ES":
      languageMapbox = "es";
      break;
    case "en_US":
      languageMapbox = "en";
      break;
    case "fr_FR":
      languageMapbox = "de";
      break;
    default:
      languageMapbox = "en";
  }
  const newSessionToken = Math.random().toString(36).substring(7);
  const response = await fetch(
    `${apiUrlSuggestion}?access_token=${token}&session_token=${newSessionToken}&q=${textSearch}&language=${languageMapbox}&country=es&proximity=${coordinates[0]},${coordinates[1]}&types=city&limit=10`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error("Error while searching: " + data.error.message);
  }
  return await Promise.all(
    data.suggestions.map(async (suggestion: any) => {
      const cityRetrievedResponse = await fetch(
        `${apiUrlRetrieve}/${suggestion.mapbox_id}?access_token=${token}&session_token=${newSessionToken}`
      );
      const cityRetrieved = await cityRetrievedResponse.json();
      return {
        id: suggestion.mapbox_id,
        name: suggestion.name,
        namePreferred: suggestion.name_preferred,
        distance: suggestion.distance,
        region: suggestion.context.region.name,
        country: suggestion.context.country.name,
        coordinates: cityRetrieved.features[0].geometry.coordinates,
      };
    })
  );
}
