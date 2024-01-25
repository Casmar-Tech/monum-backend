import { IPlace, IPlaceTranslated } from '../../domain/interfaces/IPlace.js';
import GetPlaceByIdUseCase from '../../application/GetPlaceByIdUseCase.js';
import GetPlacesUseCase from '../../application/GetPlacesUseCase.js';
import DeletePlaceAndAssociatedMediaUseCase from '../../application/DeletePlaceAndAssociatedMediaUseCase.js';
import UpdatePlaceAndAssociatedMediaUseCase from '../../application/UpdatePlaceAndAssociatedMediaUseCase.js';
import { SortField, SortOrder } from '../../domain/types/SortTypes.js';
import { checkToken } from '../../../middleware/auth.js';
import { ApolloError } from 'apollo-server-errors';
import { MongoPlaceSearchesModel } from '../../infrastructure/mongoModel/MongoPlaceSearchesModel.js';

const resolvers = {
	Place: {
		// Resolver para el campo imagesUrl
		imagesUrl: (parent: IPlaceTranslated) =>
			parent.photos?.map((photo) => photo.url),
		importance: (parent: IPlaceTranslated) =>
			(parent.importance && Math.ceil(parent.importance / 2)) || 0,
	},
	Query: {
		place: (_: any, args: { id: string }, { token }: { token: string }) => {
			const { id: userId } = checkToken(token);
			if (!userId) throw new ApolloError('User not found', 'USER_NOT_FOUND');
			return GetPlaceByIdUseCase(args.id, userId);
		},
		places: (
			_: any,
			args: {
				textSearch: string;
				centerCoordinates?: [number, number];
				sortField?: SortField;
				sortOrder?: SortOrder;
			},
			{ token }: { token: string },
		) => {
			const { id: userId } = checkToken(token);
			if (!userId) throw new ApolloError('User not found', 'USER_NOT_FOUND');
			if (args.centerCoordinates && args.centerCoordinates.length !== 2) {
				throw new ApolloError(
					'centerCoordinates must have exactly two elements.',
				);
			}
			return GetPlacesUseCase(
				userId,
				args.textSearch,
				args.centerCoordinates,
				args.sortField,
				args.sortOrder,
			);
		},
		placeSearcherSuggestions: async (
			_: any,
			args: { textSearch: string },
			{ token }: { token: string },
		) => {
			checkToken(token);
			const placeSearcherSuggestions = await MongoPlaceSearchesModel.find({
				textSearch: { $regex: args.textSearch, $options: 'i' },
			});
			const placeSuggestionsCounted = placeSearcherSuggestions.reduce(
				(acc, curr) => {
					if (acc[curr.textSearch]) {
						acc[curr.textSearch]++;
					} else {
						acc[curr.textSearch] = 1;
					}
					return acc;
				},
				{} as { [key: string]: number },
			);
			return Object.keys(placeSuggestionsCounted).sort(
				(a, b) => placeSuggestionsCounted[b] - placeSuggestionsCounted[a],
			);
		},
	},
	Mutation: {
		updatePlace: (
			parent: any,
			args: { id: string; placeUpdate: Partial<IPlace> },
			{ token }: { token: string },
		) => {
			const { id: userId } = checkToken(token);
			if (!userId) throw new ApolloError('User not found', 'USER_NOT_FOUND');
			return UpdatePlaceAndAssociatedMediaUseCase(
				userId,
				args.id,
				args.placeUpdate,
			);
		},
		deletePlace: (
			parent: any,
			args: { id: string },
			{ token }: { token: string },
		) => {
			checkToken(token);
			return DeletePlaceAndAssociatedMediaUseCase(args.id);
		},
	},
};

export default resolvers;
