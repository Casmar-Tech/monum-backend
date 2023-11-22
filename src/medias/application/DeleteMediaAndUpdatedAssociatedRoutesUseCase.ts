import { MongoMediaModel } from "../infrastructure/mongoModel/MongoMediaModel.js";
import { ApolloError } from "apollo-server-errors";
import IMedia from "../domain/IMedia.js";
import { MongoRouteModel } from "../../routes/infrastructure/mongoModel/MongoRouteModel.js";
import { getTrip } from "../../routes/infrastructure/osrm/GetTrip.js";
import { getRoute } from "../../routes/infrastructure/osrm/GetRoute.js";

export default async function DeleteMediaAndUpdatedAssociatedRoutesUseCase(
  id: string
): Promise<IMedia | null> {
  try {
    const routesToUpdate = await MongoRouteModel.find({
      "stops.media._id": id,
    });
    for (const route of routesToUpdate) {
      route.stops = route.stops.filter(
        (stop) => stop.media._id?.toString() !== id
      );
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
      route.save();
    }
    return await MongoMediaModel.findByIdAndRemove(id);
  } catch (error) {
    console.error(
      "Error while deleting Media and updating associated Routes",
      error
    );
    throw new ApolloError(
      "Error while deleting Media and deleting associated Routes",
      "DELETE_MEDIA_AND_UPDATE_ASSOCIATED_ROUTES"
    );
  }
}
