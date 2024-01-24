import { Model, model, Schema } from 'mongoose';
import { IPlace, IPlaceTranslated } from '../../domain/interfaces/IPlace.js';
import IPhoto from '../../domain/interfaces/IPhoto.js';

const Photo = new Schema<IPhoto>({
	url: { type: String, required: true },
	width: { type: Number, required: true },
	height: { type: Number, required: true },
	sizes: {
		type: Object,
		of: String,
		required: true,
	},
});

export const PlaceSchema = new Schema<IPlace>({
	name: { type: String, required: true, unique: true },
	nameTranslations: {
		type: Object,
		of: String,
		required: true,
	},
	address: {
		coordinates: {
			lat: { type: Number, required: true },
			lng: { type: Number, required: true },
		},
		street: {
			type: Object,
			of: String,
		},
		city: {
			type: Object,
			of: String,
			required: true,
		},
		postalCode: { type: String },
		province: {
			type: Object,
			of: String,
		},
		country: {
			type: Object,
			of: String,
			required: true,
		},
	},
	description: {
		type: Object,
		of: String,
	},
	importance: { type: Number },
	photos: { type: [Photo] },
	rating: { type: Number },
	googleId: { type: String, unique: true },
	googleMapsUri: { type: String },
	internationalPhoneNumber: { type: String },
	nationalPhoneNumber: { type: String },
	types: { type: [String], required: true },
	primaryType: { type: String, required: true },
	userRatingCount: { type: Number },
	websiteUri: { type: String },
});

PlaceSchema.method(
	'getSimplifiedVersion',
	function (language: string): IPlaceTranslated {
		const getTranslation = (translations: { [key: string]: string }) =>
			translations[language] || '';

		return {
			...this,
			name: getTranslation(this.nameTranslations),
			address: {
				coordinates: {
					lat: this.address.coordinates.lat,
					lng: this.address.coordinates.lng,
				},
				postalCode: this.address.postalCode,
				street: getTranslation(this.address.street || {}),
				city: getTranslation(this.address.city),
				province: getTranslation(this.address.province || {}),
				country: getTranslation(this.address.country),
			},
			description: this.description && getTranslation(this.description),
		};
	},
);

export async function createPlaceFromTranslatedPlace(
	place: IPlaceTranslated,
	language: string,
) {
	return await MongoPlaceModel.create({
		...place,
		name: place.name,
		nameTranslations: {
			[language]: place.name,
		},
		address: {
			coordinates: {
				lat: place.address.coordinates.lat,
				lng: place.address.coordinates.lng,
			},
			street: {
				[language]: place.address.street,
			},
			city: {
				[language]: place.address.city,
			},
			postalCode: place.address.postalCode,
			province: {
				[language]: place.address.province,
			},
			country: {
				[language]: place.address.country,
			},
		},
		description: {
			[language]: place.description,
		},
	});
}

export const MongoPlaceModel = model('places-news', PlaceSchema);
