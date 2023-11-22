import { MongoMediaModel } from "../../medias/infrastructure/mongoModel/MongoMediaModel.js";
import { MongoRouteModel } from "../infrastructure/mongoModel/MongoRouteModel.js";
import { ApolloError } from "apollo-server-errors";
import { getTrip } from "../infrastructure/osrm/GetTrip.js";
import { getRoute } from "../infrastructure/osrm/GetRoute.js";

export default async function AddExistingMediaToRouteUseCase(
  id: string,
  mediaId: string
) {
  try {
    const route = await MongoRouteModel.findById(id);
    if (!route) {
      throw new ApolloError(
        `Route with id ${id} does not exist`,
        "ROUTE_NOT_FOUND"
      );
    } else if (!route.stops || !Array.isArray(route.stops)) {
      throw new ApolloError(
        `Route with id ${id} does not have stops`,
        "ROUTE_WITH_NO_STOPS"
      );
    }
    const mediaToAdd = await MongoMediaModel.findById(mediaId);
    if (!mediaToAdd) {
      throw new ApolloError(
        `Media with id ${id} does not exist`,
        "MEDIA_NOT_FOUND"
      );
    }
    route.stops.push({
      media: mediaToAdd,
      order: route.stops.length,
      optimizedOrder: route.stops.length,
    });
    const coordinates = route.stops
      .map((stop) => [
        stop.media.place.address.coordinates.lng,
        stop.media.place.address.coordinates.lat,
      ])
      .filter(Boolean) as [number, number][];
    const tripData = await getTrip("foot", coordinates);
    const routeData = await getRoute("foot", coordinates);
    route.stops = route.stops.map((stop, index) => ({
      media: stop.media,
      order: index,
      optimizedOrder: tripData.waypoints[index].waypoint_index,
    }));
    route.duration = routeData.routes[0].duration;
    route.optimizedDuration = tripData.trips[0].duration;
    route.distance = routeData.routes[0].distance;
    route.optimizedDistance = tripData.trips[0].distance;
    return route.save();
  } catch (error) {
    console.error("Error while adding Media in a Route", error);
    throw new ApolloError(
      "Error while adding Media in a Route",
      "ADD_MEDIA_IN_A_ROUTE"
    );
  }
}
