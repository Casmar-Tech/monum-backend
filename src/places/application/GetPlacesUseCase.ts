import { MongoPlaceModel } from '../infrastructure/mongoModel/MongoPlaceModel.js';
import { MongoPlaceSearchesModel } from '../infrastructure/mongoModel/MongoPlaceSearchesModel.js';
import { IPlaceTranslated } from '../domain/interfaces/IPlace.js';
import { SortField, SortOrder } from '../domain/types/SortTypes.js';
import GetUserByIdUseCase from '../../users/application/GetUserByIdUseCase.js';

export default async function GetPlacesUseCase(
	userId: string,
	textSearch?: string,
	centerCoordinates?: [number, number],
	sortField?: SortField,
	sortOrder?: SortOrder,
): Promise<IPlaceTranslated[]> {
	const user = await GetUserByIdUseCase(userId);
	if (centerCoordinates && textSearch && textSearch !== '') {
		await MongoPlaceSearchesModel.create({
			centerCoordinates: {
				lat: centerCoordinates[1],
				lng: centerCoordinates[0],
			},
			textSearch,
		});
	}
	let places = [];
	if (sortField) {
		places = await MongoPlaceModel.find({
			name: { $regex: textSearch || '', $options: 'i' },
		}).sort({ [sortField]: sortOrder === 'asc' ? 1 : -1 });
	} else {
		places = await MongoPlaceModel.find({
			name: { $regex: textSearch || '', $options: 'i' },
		});
	}
	return await Promise.all(
		places.map(
			async (place) => await place.getTranslatedVersion(user.language),
		),
	);
}
