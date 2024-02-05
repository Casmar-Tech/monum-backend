import { IPlace, IPlaceTranslated } from '../../domain/interfaces/IPlace.js';
import GetPlaceByIdUseCase from '../../application/GetPlaceByIdUseCase.js';
import GetPlacesUseCase from '../../application/GetPlacesUseCase.js';
import DeletePlaceAndAssociatedMediaUseCase from '../../application/DeletePlaceAndAssociatedMediaUseCase.js';
import UpdatePlaceUseCase from '../../application/UpdatePlaceUseCase.js';
import { SortField, SortOrder } from '../../domain/types/SortTypes.js';
import { checkToken } from '../../../middleware/auth.js';
import { ApolloError } from 'apollo-server-errors';
import { MongoPlaceSearchesModel } from '../../infrastructure/mongoModel/MongoPlaceSearchesModel.js';
import { ImageSize } from '../../domain/types/ImageTypes.js';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';

const client = new S3Client({
	region: 'eu-west-1',
});

const resolvers = {
	Place: {
		imagesUrl: async (parent: IPlaceTranslated) => {
			const allPhotos: string[] = [];
			if (parent.mainPhoto) allPhotos.push(parent.mainPhoto);
			if (Array.isArray(parent.photos)) allPhotos.push(...parent.photos);

			const allPhotosUnique = Array.from(new Set(allPhotos));

			return await Promise.all(
				allPhotosUnique?.map(async (photo) => {
					const commandToGet = new GetObjectCommand({
						Bucket: process.env.S3_BUCKET_PLACES_IMAGES!,
						Key: photo,
					});
					const url = await getSignedUrl(client, commandToGet, {
						expiresIn: 3600 * 24,
					});
					return url;
				}),
			);
		},
		importance: (parent: IPlaceTranslated) =>
			(parent.importance && Math.ceil(parent.importance / 2)) || 0,
		rating: (parent: IPlaceTranslated) => parent.rating || 0,
	},
	Query: {
		place: (
			_: any,
			args: { id: string; imageSize: ImageSize },
			{ token }: { token: string },
		) => {
			const { id: userId } = checkToken(token);
			if (!userId) throw new ApolloError('User not found', 'USER_NOT_FOUND');
			return GetPlaceByIdUseCase(userId, args.id, args.imageSize);
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
			return UpdatePlaceUseCase(userId, args.id, args.placeUpdate);
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
