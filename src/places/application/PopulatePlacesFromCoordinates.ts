import '../../connection.js';
import { addPhotosToS3 } from '../infrastructure/s3/addPhotos.js';
import { MongoPlaceModel } from '../infrastructure/mongoModel/MongoPlaceModel.ts';
import { IPlace } from '../domain/interfaces/IPlace.ts';
import { fromGoogleToMonumLanguage } from '../infrastructure/google/utils.ts';

const url = 'https://places.googleapis.com/v1/places:searchNearby';
const apiKey = 'AIzaSyApcrBgkoBmvB0RBeHYd4nAfIHQwngt1Q0'; // Asegúrate de proteger tu clave de API
const includedTypes = [
	'church',
	// 'airport',
	'aquarium',
	'art_gallery',
	'amusement_park',
	'bus_station',
	'courthouse',
	'embassy',
	'hindu_temple',
	'library',
	'local_government_office',
	'mosque',
	'movie_theater',
	'museum',
	'park',
	'stadium',
	'synagogue',
	// 'train_station',
	'tourist_attraction',
	'university',
	'zoo',
];

const SMALL_PHOTO_MAX_HEIGHT_PX = 200;
const SMALL_PHOTO_MAX_WIDTH_PX = 400;
const MEDIUM_PHOTO_MAX_HEIGHT_PX = 600;
const MEDIUM_PHOTO_MAX_WIDTH_PX = 1200;
const LARGE_PHOTO_MAX_HEIGHT_PX = 1200;
const LARGE_PHOTO_MAX_WIDTH_PX = 2400;
const ORIGINAL_PHOTO_MAX_HEIGHT_PX = 4800;
const ORIGINAL_PHOTO_MAX_WIDTH_PX = 4800;

async function getPhotoWithSizes(photoName: string): Promise<void> {
	for (const size of ['small', 'medium', 'large', 'original']) {
		try {
			let height = 0;
			let width = 0;
			switch (size) {
				case 'small':
					height = SMALL_PHOTO_MAX_HEIGHT_PX;
					width = SMALL_PHOTO_MAX_WIDTH_PX;
					break;
				case 'medium':
					height = MEDIUM_PHOTO_MAX_HEIGHT_PX;
					width = MEDIUM_PHOTO_MAX_WIDTH_PX;
					break;
				case 'large':
					height = LARGE_PHOTO_MAX_HEIGHT_PX;
					width = LARGE_PHOTO_MAX_WIDTH_PX;
					break;
				case 'original':
					height = ORIGINAL_PHOTO_MAX_HEIGHT_PX;
					width = ORIGINAL_PHOTO_MAX_WIDTH_PX;
					break;
			}
			const url = `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=${height}&maxWidthPx=${width}&key=${apiKey}`;
			const response = await fetch(url);
			const buffer = await response.arrayBuffer();
			await addPhotosToS3(photoName, buffer, size);
		} catch (error) {
			console.log(error);
		}
	}
}

async function searchInCircle(center: [number, number], radius: number) {
	const data = {
		includedTypes,
		maxResultCount: 20,
		locationRestriction: {
			circle: {
				center: {
					latitude: center[0],
					longitude: center[1],
				},
				radius: radius,
			},
		},
	};
	const options = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-Goog-Api-Key': apiKey,
			'X-Goog-FieldMask': '*',
			'Accept-Language': 'en',
		},
		body: JSON.stringify(data),
	};
	const response = await fetch(url, options);
	const json = await response.json();
	return json.places;
}

async function main(
	coordinates: [number, number],
	radius: number = 10000,
	maxResultCount: number = 20,
) {
	const maxResultsPerRequest = 1;
	const numberOfCircles = Math.ceil(maxResultCount / maxResultsPerRequest);
	const smallCircleRadius = radius / Math.sqrt(numberOfCircles);

	let places: IPlace[] = [];
	let count = 0;

	// Este es un ejemplo básico de distribución de centros. Necesitarías ajustarlo para cubrir correctamente el área.
	for (let i = 0; i < Math.sqrt(numberOfCircles); i++) {
		for (let j = 0; j < Math.sqrt(numberOfCircles); j++) {
			// Calcular el centro de cada círculo pequeño
			const offsetLat = (smallCircleRadius / 111111) * i; // ~111111 metros por grado de latitud
			const offsetLng =
				(smallCircleRadius / (111111 * Math.cos(coordinates[0]))) * j; // Ajustar por coseno de la latitud para longitud

			const newCenter = [
				coordinates[0] + offsetLat,
				coordinates[1] + offsetLng,
			] as [number, number];

			try {
				// Llamar a la función de búsqueda para este círculo pequeño
				const partialResults = await searchInCircle(
					newCenter,
					smallCircleRadius,
				);

				places = Array.from(
					new Set([
						...places,
						...(await Promise.all(
							partialResults.map(async (place: any) => {
								if (Array.isArray(place.photos)) {
									for (const photo of place.photos) {
										await getPhotoWithSizes(photo.name);
									}
								}
								const street = place.addressComponents.find((ad: any) =>
									ad.types.includes('route'),
								);
								const number = place.addressComponents.find((ad: any) =>
									ad.types.includes('street_number'),
								);
								const city = place.addressComponents.find((ad: any) =>
									ad.types.includes('locality'),
								);
								const postalCode = place.addressComponents.find((ad: any) =>
									ad.types.includes('postal_code'),
								);
								const province = place.addressComponents.find((ad: any) =>
									ad.types.includes('administrative_area_level_2'),
								);
								const county = place.addressComponents.find((ad: any) =>
									ad.types.includes('administrative_area_level_1'),
								);
								const country = place.addressComponents.find((ad: any) =>
									ad.types.includes('country'),
								);
								const primaryType =
									place.primaryType ||
									(Array.isArray(place.types) && place.types[0]);

								return {
									name: place.displayName.text,
									nameTranslations: {
										[place.displayName
											? fromGoogleToMonumLanguage(
													place.displayName.languageCode,
											  )
											: 'en_US']: place.displayName.text,
									},
									address: {
										street: {
											[street?.languageCode
												? fromGoogleToMonumLanguage(street.languageCode)
												: 'en_US']: `${street?.longText} ${number?.longText}`,
										},
										city: {
											[city?.languageCode
												? fromGoogleToMonumLanguage(city.languageCode)
												: 'en_US']: city?.longText,
										},
										postalCode: postalCode.longText,
										province: {
											[province?.languageCode
												? fromGoogleToMonumLanguage(province.languageCode)
												: 'en_US']: province?.longText,
										},
										county: {
											[county?.languageCode
												? fromGoogleToMonumLanguage(county.languageCode)
												: 'en_US']: county?.longText,
										},
										country: {
											[country?.languageCode
												? fromGoogleToMonumLanguage(country.languageCode)
												: 'en_US']: country?.longText,
										},
										coordinates: {
											lat: place.location.latitude,
											lng: place.location.longitude,
										},
									},
									photos:
										Array.isArray(place.photos) &&
										place.photos.map((photo: any) => {
											return {
												url: photo.name,
												width: photo.widthPx,
												height: photo.heightPx,
												sizes: {
													original: `${photo.name}/original.jpg`,
													small: `${photo.name}/small.jpg`,
													medium: `${photo.name}/medium.jpg`,
													large: `${photo.name}/large.jpg`,
												},
											};
										}),
									rating: place.rating,
									googleId: place.id,
									googleMapsUri: place.googleMapsUri,
									internationalPhoneNumber: place.internationalPhoneNumber,
									nationalPhoneNumber: place.nationalPhoneNumber,
									types: place.types,
									primaryType: primaryType,
									userRatingCount: place.userRatingCount,
									websiteUri: place.websiteUri,
								} as IPlace;
							}),
						)),
					]),
				);
				count += partialResults.length;
			} catch (error) {
				console.log(error);
			}
			// Verificar si ya alcanzamos el maxResultCount
			if (count >= maxResultCount) break;
		}
		if (count >= maxResultCount) break;
	}

	// Al final, en lugar de MongoPlaceModel.insertMany(places);
	for (const place of places) {
		try {
			await MongoPlaceModel.create(place);
		} catch (error) {
			console.error(
				`Error creating the place: ${place.name}, error: ${error.message}`,
			);
		}
	}
	console.log('Done!');
}

main([41.98, 2.82], 20000, 50);
