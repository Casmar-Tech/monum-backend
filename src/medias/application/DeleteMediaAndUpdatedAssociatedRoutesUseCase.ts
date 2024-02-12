import { MongoMediaModel } from '../infrastructure/mongoModel/MongoMediaModel.js';
import { ApolloError } from 'apollo-server-errors';
import { MongoRouteModel } from '../../routes/infrastructure/mongoModel/MongoRouteModel.js';
import { getTrip } from '../../routes/infrastructure/osrm/GetTrip.js';
import { getRoute } from '../../routes/infrastructure/osrm/GetRoute.js';
import { MongoPlaceModel } from '../../places/infrastructure/mongoModel/MongoPlaceModel.js';
import { Types } from 'mongoose';

export default async function DeleteMediaAndUpdatedAssociatedRoutesUseCase(
	id: string,
): Promise<boolean> {
	try {
		const routesToUpdate = await MongoRouteModel.find({
			'stops.media._id': id,
		});
		// Extraer todos los placeId de los stops
		let placeIds: Types.ObjectId[] = [];
		routesToUpdate.forEach((route) => {
			route.stops.forEach((stop) => {
				if (stop.media._id?.toString() !== id) {
					placeIds.push(new Types.ObjectId(stop.media.placeId));
				}
			});
		});

		// Desduplicar placeIds convirtiendo a string y luego de nuevo a ObjectId
		const uniquePlaceIds = Array.from(
			new Set(placeIds.map((id) => id.toString())),
		).map((strId) => new Types.ObjectId(strId));

		// Consultar coordenadas para cada placeId
		const places = await MongoPlaceModel.find({
			_id: { $in: uniquePlaceIds },
		}).lean();

		// Mapear placeId a coordenadas
		const placeIdToCoordinates: Record<string, [number, number]> = {};
		places.forEach((place) => {
			placeIdToCoordinates[place._id.toString()] = [
				place.address.coordinates.lng,
				place.address.coordinates.lat,
			];
		});

		for (const route of routesToUpdate) {
			route.stops = route.stops.filter(
				(stop) => stop.media._id?.toString() !== id,
			);
			const coordinates: [number, number][] = route.stops
				.filter((stop) => stop.media._id?.toString() !== id)
				.map((stop) => placeIdToCoordinates[stop.media.placeId.toString()])
				.filter(Boolean);
			const tripData = await getTrip('foot', coordinates);
			const routeData = await getRoute('foot', coordinates);
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
		await MongoMediaModel.findByIdAndRemove(new Types.ObjectId(id), {
			lean: true,
		});
		return true;
	} catch (error) {
		console.error(
			'Error while deleting Media and updating associated Routes',
			error,
		);
		throw new ApolloError(
			'Error while deleting Media and deleting associated Routes',
			'DELETE_MEDIA_AND_UPDATE_ASSOCIATED_ROUTES',
		);
	}
}
