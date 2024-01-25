import '../../connection.js';
import { Configuration, OpenAIApi } from 'openai';
import { MongoPlaceModel } from '../infrastructure/mongoModel/MongoPlaceModel';

async function main(city: string) {
	let query = {
		description: { $exists: false },
		importance: { $exists: false },
	};
	if (city) {
		// Si se proporciona una ciudad, añadirla a la consulta
		query['address.city.ca_ES'] = city;
	}

	// Ahora query incluye el filtro de city solo si se proporcionó uno
	const placesToUpdate = await MongoPlaceModel.find(query).limit(5);

	const configuration = new Configuration({
		organization: process.env.OPENAI_ORGANIZATION_ID || '',
		apiKey: process.env.OPENAI_API_KEY || '',
	});
	const openai = new OpenAIApi(configuration);
	const chunkSize = 5;
	for (let i = 0; i < placesToUpdate.length; i += chunkSize) {
		try {
			const places = placesToUpdate.slice(i, i + chunkSize);
			const placeString = await openai.createChatCompletion({
				model: 'gpt-3.5-turbo',
				messages: [
					{
						role: 'user',
						content: `I want to populate my MongoDB database. This database contain some places of interest and monuments.
          I have all the necessary information minus the importance and a description of the site.
          For this reason I ask you to give me an importance of the place of interest regarding the city as well as a small description of about 200 characters.
          I am sending you the list of places of interest that I want you to analyze as well as the city in which they are located.
          Places of interest: ${places.map((place) => place.name).join(', ')}
          City: ${city}
          The structure of the object you have to return must be like:
          {
            "name": <string> (name of the place of interest that i said before),
            "importance": <number> (integer between 0-10 specifing the importance of the monument in the city),
            "description": <string> (Summary description of the monument of about 200 characters approximately)
          }
          The answer you have to give me must be an array with the different objects for each location of interes in the same order and convertible into a JSON object directly with the JSON.parse() function so that I can insert it directly into my database.
          Therefore, you only have to give me back what I ask you (without any introduction or additional text) only what I have asked you strictly.`,
					},
				],
			});
			const placesJSON = JSON.parse(
				placeString.data.choices[0].message?.content || '',
			);
			if (!Array.isArray(placesJSON)) {
				throw new Error(
					'Response from OpenAI is not in the format we were expecting',
				);
			}
			await Promise.all(
				placesJSON.map(async (place: any, index: number) => {
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
}

main('Girona');
