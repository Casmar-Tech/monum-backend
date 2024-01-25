import '../../connection.js';
import { MongoPlaceModel } from '../../places/infrastructure/mongoModel/MongoPlaceModel.js';
import PopulateMediaByNumberUseCase from '../application/PopulateMediaByNumberUseCase.js';
async function main() {
	let places = await MongoPlaceModel.aggregate([
		{
			$lookup: {
				from: 'medias', // Asegúrate de que el nombre de la colección es correcto
				localField: '_id',
				foreignField: 'place',
				as: 'mediaDocs',
			},
		},
		{
			$project: {
				_id: 1,
				name: 1, // Incluye otros campos del place que necesites
				mediaCount: { $size: '$mediaDocs' },
			},
		},
		{
			$match: {
				mediaCount: { $lt: 3 },
			},
		},
	]);
	await Promise.all(
		places
			.slice(0, 1)
			.map(async (place) => await PopulateMediaByNumberUseCase(place._id)),
	);
	console.log('Done!');
}

main();
