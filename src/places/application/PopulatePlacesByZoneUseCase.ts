import { Configuration, OpenAIApi } from 'openai';
import { Photo as PexelsPhoto, createClient } from 'pexels';
import Photo from '../domain/valueObjects/Photo.js';
import { IPlaceTranslated } from '../domain/interfaces/IPlace.js';
import PopulateMediaUseCase from '../../medias/application/PopulateMediaByNumberUseCase.js';
import { createPlaceFromTranslatedPlace } from '../infrastructure/mongoModel/MongoPlaceModel.js';
import { ApolloError } from 'apollo-server-errors';

export default async function PopulatePlacesByZoneUseCase(
	zone: string,
	number: number = 1,
	addMedia: boolean = false,
) {
	try {
		const configuration = new Configuration({
			organization: process.env.OPENAI_ORGANIZATION_ID || '',
			apiKey: process.env.OPENAI_API_KEY || '',
		});
		const openai = new OpenAIApi(configuration);
		const pexelsClient = createClient(process.env.PEXELS_API_KEY || '');
		const placesString = await openai.createChatCompletion({
			model: 'gpt-3.5-turbo',
			messages: [
				{
					role: 'user',
					content: `I want to populate my MongoDB database. This database has to contain the most important places of interest in a zone, neighborhood, city, region or country. For this reason, I ask you to return me a list of the ${number} most important monuments or places of interest of the region/zone ${zone}.
            The structure of the objects that compose my database is the following:
            {
              "name": <string> (name of the place of interest),
              "address": {
                "coordinates": {
                  "lat": <number>,
                  "lng": <number>
                },
                "street": <string>,
                "city": <string>,
                "postalCode": <string>,
                "province": <string>,
                "country": <string>,
              },
              "importance": <number> (integer between 0-10 specifing the importance of the monument in the city),
              "rating": <number> (random float between 0-5 with 2 decimal places, for example: 3.67),
              "description": <string> (Summary description of the monument of about 200 characters approximately)
            }
            The answer you have to give me must be convertible into an object directly with the JSON.parse() function so that I can insert it directly into my database. Therefore, you only have to give me back what I ask you (without any introduction or additional text) only what I have asked you strictly.`,
				},
			],
		});
		const placesJSON = JSON.parse(
			placesString.data.choices[0].message?.content || '',
		);
		if (!Array.isArray(placesJSON)) {
			throw new ApolloError(
				'Response from OpenAI is not in the format we were expecting',
				'OPEN_AI_RESPONSE_BAD_FORMAT',
			);
		}
		return await Promise.all(
			placesJSON.map(async (place: IPlaceTranslated) => {
				const photos: any = await pexelsClient.photos.search({
					query: place.name,
					per_page: 5,
				});
				if (Array.isArray(photos.photos)) {
					place.photos = photos.photos.map(
						(photo: PexelsPhoto) =>
							new Photo({
								width: photo.width,
								height: photo.height,
								url: photo.src.original,
								sizes: { original: photo.src.original },
							}),
					);
				}
				const placeCreated = await createPlaceFromTranslatedPlace(
					place,
					'en_US',
				);
				if (placeCreated._id && addMedia) {
					await PopulateMediaUseCase(placeCreated._id.toString(), 10);
				}
				return placeCreated;
			}),
		);
	} catch (error) {
		console.log('Error', error);
		throw error;
	}
}
