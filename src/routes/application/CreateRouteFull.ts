import { IMedia } from "../../medias/domain/interfaces/IMedia.js";
import { MongoMediaModel } from "../../medias/infrastructure/mongoModel/MongoMediaModel.js";
import { MongoPlaceModel } from "../../places/infrastructure/mongoModel/MongoPlaceModel.js";
import { Languages } from "../../shared/Types.js";
import { MongoUserModel } from "../../users/infrastructure/mongoModel/MongoUserModel.js";
import { getTranslatedRoute } from "../domain/functions/Route.js";
import { IRoute, IRouteTranslated } from "../domain/interfaces/IRoute.js";
import { IStop } from "../domain/interfaces/IStop.js";
import { CreateRouteFullInput } from "../infrastructure/graphql/resolvers.js";
import { MongoRouteModel } from "../infrastructure/mongoModel/MongoRouteModel.js";
import { ApolloError } from "apollo-server-errors";

export default async function CreateRouteFull(
  userId: string,
  route: CreateRouteFullInput
): Promise<IRoute> {
  const arrayToObjectLanguage = (array: any[]) =>
    array.reduce((obj, item) => {
      obj[item.key as Languages] = item.value;
      return obj;
    }, {} as { [key in Languages]: string });
  const stops: IStop[] = [];
  await Promise.all(
    route.stops.map(async (stop) => {
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
        stops.push({
          place: place,
          medias: medias,
          order: stop.order,
          optimizedOrder: stop.optimizedOrder || stop.order,
        });
      } catch (error) {
        throw new ApolloError("Place not found", "PLACE_NOT_FOUND");
      }
    })
  );

  const newRouteModel = new MongoRouteModel({
    title: arrayToObjectLanguage(route.title),
    description: arrayToObjectLanguage(route.description),
    cityId: route.cityId,
    createdBy: userId,
    stops: stops,
  });
  return newRouteModel.save();
}
