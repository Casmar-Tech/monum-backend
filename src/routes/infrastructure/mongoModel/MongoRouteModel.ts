import { Model, model, Schema } from 'mongoose';
import { IRoute, IRouteSimplified } from '../../domain/IRoute.js';
import { MediaSchema } from '../../../medias/infrastructure/mongoModel/MongoMediaModel.js';
import { IStop } from '../../domain/IStop.js';

interface IRouteMethods {
	getSimplifiedVersion: (language: string) => IRouteSimplified;
}

type RouteModel = Model<IRoute, {}, IRouteMethods>;

const StopSchema = new Schema<IStop>({
	order: { type: Number, required: true },
	optimizedOrder: { type: Number, required: true },
	media: { type: MediaSchema },
});

const RouteSchema = new Schema<IRoute, RouteModel, IRouteMethods>({
	title: {
		type: Object,
		of: String,
		required: true,
	},
	description: { type: Object, of: String, required: true },
	rating: { type: Number },
	stops: [{ type: StopSchema, required: true }],
	duration: { type: Number, required: true },
	optimizedDuration: { type: Number, required: true },
	distance: { type: Number, required: true },
	optimizedDistance: { type: Number, required: true },
	cityId: { type: Schema.Types.ObjectId, ref: 'cities' },
});

RouteSchema.method(
	'getSimplifiedVersion',
	function (language: string): IRouteSimplified {
		const getTranslation = (translations: { [key: string]: string }) =>
			translations[language] || '';

		return {
			id: this.id,
			title: getTranslation(this.title),
			description: getTranslation(this.description),
			rating: this.rating,
			stops: this.stops.map((stop) => ({
				order: stop.order,
				optimizedOrder: stop.optimizedOrder,
				media: stop.media.getSimplifiedVersion(language),
			})),
			duration: this.duration,
			optimizedDuration: this.optimizedDuration,
			distance: this.distance,
			optimizedDistance: this.optimizedDistance,
			cityId: this.cityId,
		};
	},
);

export async function createRouteFromSimpleRoute(
	route: IRouteSimplified,
	language: string,
) {
	return await MongoRouteModel.create({
		title: {
			[language]: route.title,
		},
		description: {
			[language]: route.description,
		},
		rating: route.rating,
		stops: route.stops,
		duration: route.duration,
		optimizedDuration: route.optimizedDuration,
		distance: route.distance,
		optimizedDistance: route.optimizedDistance,
		cityId: route.cityId,
	});
}

export const MongoRouteModel = model('routes-news', RouteSchema);
