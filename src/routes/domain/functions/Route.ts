import { getTranslatedMedia } from "../../../medias/domain/functions/Media.js";
import { getTranslatedPlace } from "../../../places/domain/functions/Place.js";
import { IRoute, IRouteTranslated } from "../interfaces/IRoute.js";

const getTranslation = (
  translations: { [key: string]: string },
  language: string
): string => {
  return translations[language] || Object.values(translations)[0] || "";
};

export async function getTranslatedRoute(
  route: IRoute,
  language: string
): Promise<IRouteTranslated> {
  return {
    ...route,
    id: route?._id?.toString() || "",
    title: getTranslation(route.title, language),
    description: getTranslation(route.description, language),
    stops: await Promise.all(
      route.stops.map(async (stop) => ({
        order: stop.order,
        optimizedOrder: stop.optimizedOrder,
        medias: await Promise.all(
          stop.medias.map(
            async (media) => await getTranslatedMedia(media, language)
          )
        ),
        place: await getTranslatedPlace(stop.place, language),
      }))
    ),
  };
}
