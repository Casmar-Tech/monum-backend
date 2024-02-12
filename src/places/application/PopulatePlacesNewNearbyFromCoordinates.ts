import '../../connection.js';
import {
	LARGE_PHOTO_MAX_WIDTH_PX,
	MEDIUM_PHOTO_MAX_WIDTH_PX,
	ORIGINAL_PHOTO_MAX_WIDTH_PX,
	SMALL_PHOTO_MAX_WIDTH_PX,
	addPhotosToS3,
} from '../infrastructure/s3/photos.js';
import { MongoPlaceModel } from '../infrastructure/mongoModel/MongoPlaceModel.ts';
import { IPlace } from '../domain/interfaces/IPlace.ts';
import { fromGoogleToMonumLanguage } from '../infrastructure/google/utils.ts';
import OpenAI from 'openai';
import { includedTypes } from '../infrastructure/google/utils.ts';

// Define constants for the Google Places API
const url = 'https://places.googleapis.com/v1/places:searchNearby';
const apiKey = process.env.GOOGLE_API_KEY!;

const openai = new OpenAI();

// Function to get photos of different sizes and upload to S3
async function addPhotoWithSizes(photoName: string): Promise<void> {
	// Loop through different sizes
	for (const size of ['small', 'medium', 'large', 'original']) {
		try {
			let width = 0;
			switch (size) {
				case 'small':
					width = SMALL_PHOTO_MAX_WIDTH_PX;
					break;
				case 'medium':
					width = MEDIUM_PHOTO_MAX_WIDTH_PX;
					break;
				case 'large':
					width = LARGE_PHOTO_MAX_WIDTH_PX;
					break;
				case 'original':
					width = ORIGINAL_PHOTO_MAX_WIDTH_PX;
					break;
			}
			// Construct URL for fetching the photo
			const url = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${width}&key=${apiKey}`;
			// Fetch and upload the photo
			const response = await fetch(url);
			const buffer = await response.arrayBuffer();
			await addPhotosToS3(photoName, buffer, size);
			console.log(`Photo ${photoName} with size ${size} added to S3`);
		} catch (error) {
			console.log(error);
		}
	}
}

// Function to search for places within a given radius
async function searchInCircle(
	center: [number, number],
	radius: number,
): Promise<any> {
	// Prepare data for the POST request
	const data = {
		includedPrimaryTypes: includedTypes,
		maxResultCount: 10,
		languageCode: 'en',
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
	// Make the API call and return places
	const response = await fetch(url, options);
	const json = await response.json();
	return json.places;
}

// Function to add descriptions and importance to places using OpenAI
async function addDescriptionAndImportance(places: IPlace[]) {
	let placesToReturn: IPlace[] = [];
	try {
		const country =
			places[0].address.country['en_US'] ||
			Object.values(places[0].address.country)[0];
		const city =
			places[0].address.city['en_US'] ||
			Object.values(places[0].address.city)[0];
		const placeString = await openai.chat.completions.create({
			model: 'gpt-3.5-turbo-1106',
			response_format: { type: 'json_object' },
			messages: [
				{
					role: 'system',
					content: 'You are a helpful assistant designed to output JSON.',
				},
				{
					role: 'user',
					content: `I am going to give you a list of "placesOfInterest" and the country and city where they are located and I want you to give me a short "description" and the "importance" (integer number from 1 to 10) of each one relative to the city.
								I want them to be ordered the same way I send them to you.
          						Places of interest: ${places
												.map((place: IPlace) => place.name)
												.join(', ')}
         						City: ${city}
								Country: ${country}`,
				},
			],
		});
		const { placesOfInterest } = JSON.parse(
			placeString.choices[0].message?.content || '',
		);
		if (!Array.isArray(placesOfInterest)) {
			throw new Error(
				'Response from OpenAI is not in the format we were expecting',
			);
		}

		placesToReturn = places.map((place, index) => {
			const { importance, description } = placesOfInterest[index];
			return {
				...place,
				description: {
					en_US: description,
				},
				importance: importance,
			};
		});
	} catch (error) {
		console.log(error);
	}
	return placesToReturn;
}

// Función para insertar lugares en la base de datos.
async function insertPlacesIntoDatabase(places) {
	for (const place of places) {
		try {
			await MongoPlaceModel.create(place);
		} catch (error) {
			console.error(
				`Error creating the place: ${place.name}, error: ${error.message}`,
			);
		}
	}
}

// Main function to populate places nearby from given coordinates
async function PopulatePlacesNearbyFromCoordinates(
	coordinates: [number, number],
	maxResultCount: number = 20,
) {
	const smallCircleRadius = 1000; // Fijamos el radio a 1km
	let places: IPlace[] = [];
	let offsetMultiplier = 0; // Para expandir la búsqueda en un patrón de cuadrícula.

	while (places.length < maxResultCount) {
		let attempts = 0; // Contador para intentos de búsqueda en esta iteración.

		// Expandir la búsqueda en un patrón de cuadrícula.
		for (
			let i = -offsetMultiplier;
			i <= offsetMultiplier && places.length < maxResultCount;
			i++
		) {
			for (
				let j = -offsetMultiplier;
				j <= offsetMultiplier && places.length < maxResultCount;
				j++
			) {
				// Calcula las nuevas coordenadas centrales.
				const offsetLat = (smallCircleRadius / 111111) * i; // ~111111 metros por grado de latitud.
				const offsetLng =
					(smallCircleRadius / (111111 * Math.cos(coordinates[0]))) * j; // Ajustar por longitud basado en latitud.

				const newCenter: [number, number] = [
					coordinates[0] + offsetLat,
					coordinates[1] + offsetLng,
				];

				try {
					const placesFetched = await searchInCircle(
						newCenter,
						smallCircleRadius,
					);
					let placesFetchedFiltered: any[] = [];
					if (Array.isArray(placesFetched)) {
						for (const place of placesFetched) {
							const mongoPlace = await MongoPlaceModel.findOne({
								googleId: place.id,
							});
							const placedPrevAdded = places.find(
								(p) => p.googleId === place.id,
							);
							if (
								!mongoPlace &&
								!placedPrevAdded &&
								Array.isArray(place.photos)
							) {
								placesFetchedFiltered.push(place);
							}
						}
					}

					let newAddedPlaces = await Promise.all(
						placesFetchedFiltered.map(async (place: any) => {
							try {
								for (const photo of place.photos) {
									await addPhotoWithSizes(photo.name);
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
									photos: place.photos.map((photo: any) => {
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
							} catch (error) {
								console.error('Error processing place: ', error);
								return null;
							}
						}),
					);
					const newAddedPlacesWithoutNull = newAddedPlaces.filter(
						(place) => place !== null,
					) as IPlace[];

					if (newAddedPlacesWithoutNull.length > 0) {
						places = [...places, ...newAddedPlacesWithoutNull];
					}
				} catch (error) {
					console.error(error);
				}

				attempts++;
				if (attempts >= (2 * offsetMultiplier + 1) ** 2) break;
			}
		}

		if (places.length >= maxResultCount) break;
		offsetMultiplier += 1;
	}

	const chunkSize = 10;
	const placesToInsert: IPlace[] = [];
	for (let i = 0; i < places.length; i += chunkSize) {
		const chunk = places.slice(i, i + chunkSize);
		const placesWithDescriptionAndImportance =
			await addDescriptionAndImportance(chunk);
		placesToInsert.push(...placesWithDescriptionAndImportance);
	}
	await insertPlacesIntoDatabase(placesToInsert);
	console.log('Done!', places.length);
}

// PopulatePlacesNearbyFromCoordinates([41.977381, 2.820167], 30);
