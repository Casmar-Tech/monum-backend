import '../../connection.js';
import OpenAI from 'openai';
import { MongoPlaceModel } from '../infrastructure/mongoModel/MongoPlaceModel.js';

async function UpdateDescriptionAndImportance(city?: string) {
	let query = {
		$or: [
			{ description: { $exists: false } },
			{ importance: { $exists: false } },
		],
	};
	if (city) {
		// Si se proporciona una ciudad, añadirla a la consulta
		query['address.city.ca_ES'] = city;
	}

	// Ahora query incluye el filtro de city solo si se proporcionó uno
	const placesToUpdate = await MongoPlaceModel.find(query);

	const openai = new OpenAI();
	const chunkSize = 5;
	for (let i = 0; i < placesToUpdate.length; i += chunkSize) {
		try {
			const places = placesToUpdate.slice(i, i + chunkSize);
			const country =
				places[0]?.address?.country['en_US'] ||
				Object.values(places[0].address.country)[0];
			const city =
				places[0]?.address?.city['en_US'] ||
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
          						Places of interest: ${places.map((place) => place.name).join(', ')}
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
			await Promise.all(
				placesOfInterest.map(async (place: any, index: number) => {
					const placeToUpdate = places[index];
					placeToUpdate.description = {
						en_US: place.description,
					};
					placeToUpdate.importance = place.importance;
					await placeToUpdate.save();
				}),
			);
		} catch (error) {
			console.log(error);
		}
	}
	console.log(`Done!`);
}

UpdateDescriptionAndImportance();
