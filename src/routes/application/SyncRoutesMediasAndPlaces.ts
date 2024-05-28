import { IMedia } from "../../medias/domain/interfaces/IMedia.js";
import { MongoMediaModel } from "../../medias/infrastructure/mongoModel/MongoMediaModel.js";
import { MongoPlaceModel } from "../../places/infrastructure/mongoModel/MongoPlaceModel.js";
import { IStop } from "../domain/interfaces/IStop.js";
import { MongoRouteModel } from "../infrastructure/mongoModel/MongoRouteModel.js";
import "../../connection";

async function SyncRoutesMediasAndPlaces() {
  const routes = await MongoRouteModel.find();
  console.log(`Found ${routes.length} routes`);
  let i = 0;
  for (const route of routes) {
    i++;
    const stopsUpdated: IStop[] = [];
    for (const stop of route.stops) {
      const placeUpdated = await MongoPlaceModel.findById(stop.place._id);
      if (!placeUpdated) {
        console.log(`Place ${stop.place._id} not found`);
        continue;
      }
      const mediasUpdated: IMedia[] = [];
      for (const media of stop.medias) {
        const mediaDocument = await MongoMediaModel.findById(media);
        if (!mediaDocument) {
          console.log(`Media ${media} not found`);
          continue;
        }
        mediasUpdated.push(mediaDocument);
      }
      stopsUpdated.push({
        ...stop,
        place: placeUpdated,
        medias: mediasUpdated,
      });
    }
    route.stops = stopsUpdated;
    await route.save();
    console.log(`Route ${route.id} updated: ${i}/${routes.length}`);
  }
}
SyncRoutesMediasAndPlaces();
