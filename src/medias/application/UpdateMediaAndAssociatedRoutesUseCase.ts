import { MongoRouteModel } from "../../routes/infrastructure/mongoModel/MongoRouteModel.js";
import { MongoMediaModel } from "../infrastructure/mongoModel/MongoMediaModel.js";
import IMedia from "../domain/IMedia.js";
import { getTrip } from "../../routes/infrastructure/osrm/GetTrip.js";
import { getRoute } from "../../routes/infrastructure/osrm/GetRoute.js";

export default async function UpdateMediaAndAssociatedRoutesUseCase(
  id: string,
  mediaUpdate: Partial<IMedia>
): Promise<IMedia | null> {
  const mediaUpdated = await MongoMediaModel.findByIdAndUpdate(
    id,
    mediaUpdate,
    { new: true }
  );
  if (mediaUpdated) {
    const routesToUpdate = await MongoRouteModel.find({
      "stops.media._id": id,
    });
    for (const route of routesToUpdate) {
      const stopIndex = route.stops.findIndex(
        (stop) => stop.media._id?.toString() === id
      );
      if (stopIndex > -1) {
        route.stops[stopIndex].media = mediaUpdated;
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
    }
  }
  return mediaUpdated;
}
