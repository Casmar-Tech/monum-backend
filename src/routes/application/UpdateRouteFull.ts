import { ApolloError } from "apollo-server-errors";
import { UpdateRouteFullInput } from "../infrastructure/graphql/resolvers.js";
import { Languages } from "../../shared/Types.js";
import { MongoPlaceModel } from "../../places/infrastructure/mongoModel/MongoPlaceModel.js";
import { MongoMediaModel } from "../../medias/infrastructure/mongoModel/MongoMediaModel.js";
import { IMedia } from "../../medias/domain/interfaces/IMedia.js";
import { IStop } from "../domain/interfaces/IStop.js";
import { MongoRouteModel } from "../infrastructure/mongoModel/MongoRouteModel.js";
import { IRoute } from "../domain/interfaces/IRoute.js";

export default async function UpdateRouteFull(
  id: string,
  routeUpdate: UpdateRouteFullInput
): Promise<IRoute> {
  const arrayToObjectLanguage = (array: any[]) =>
    array.reduce((obj, item) => {
      obj[item.key as Languages] = item.value;
      return obj;
    }, {} as { [key in Languages]: string });
  const route = await MongoRouteModel.findById(id);
  if (!route) {
    throw new ApolloError("Route not found", "ROUTE_NOT_FOUND");
  }
  if (Array.isArray(routeUpdate.stops)) {
    const newStops: IStop[] = [];
    for (const stop of routeUpdate.stops) {
      try {
        const place = await MongoPlaceModel.findById(stop.placeId);
        if (!place) {
          throw new ApolloError("Place not found", "PLACE_NOT_FOUND");
        }
        const medias: IMedia[] = [];
        for (const mediaId of stop.mediasIds) {
          try {
            const media = await MongoMediaModel.findById(mediaId);
            if (!media) {
              throw new ApolloError("Media not found", "MEDIA_NOT_FOUND");
            }
            medias.push(media);
          } catch (error) {
            throw new ApolloError("Media not found", "MEDIA_NOT_FOUND");
          }
        }
        newStops.push({
          place: place,
          medias: medias,
          order: stop.order,
          optimizedOrder: stop.optimizedOrder || stop.order,
        });
      } catch (error) {
        throw new ApolloError("Place not found", "PLACE_NOT_FOUND");
      }
    }
    route.stops = newStops;
  }
  if (routeUpdate.title) {
    route.title = arrayToObjectLanguage(routeUpdate.title);
  }
  if (routeUpdate.description) {
    route.description = arrayToObjectLanguage(routeUpdate.description);
  }
  return await route.save();
}
