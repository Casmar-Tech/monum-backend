import { MongoMediaModel } from '../infrastructure/mongoModel/MongoMediaModel.js';
import { IMediaTranslated } from '../domain/IMedia.js';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { GraphQLError } from 'graphql';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import GetUserByIdUseCase from '../../users/application/GetUserByIdUseCase.js';
import { MongoPlaceModel } from '../../places/infrastructure/mongoModel/MongoPlaceModel.js';

export default async function GetMediaByIdUseCase(
	id: string,
	userId: string,
): Promise<IMediaTranslated> {
	try {
		const media = await MongoMediaModel.findById(id);
		const user = await GetUserByIdUseCase(userId);
		if (!media) {
			throw new GraphQLError('Media not found', {
				extensions: {
					code: 'MEDIA_NOT_FOUND',
					http: { status: 404 },
				},
			});
		}
		const place = await MongoPlaceModel.findById(media.placeId);
		if (!place) {
			throw new GraphQLError('Place not found', {
				extensions: {
					code: 'PLACE_NOT_FOUND',
					http: { status: 404 },
				},
			});
		}
		media.place = place;
		return media.getTranslatedVersion(user.language);
	} catch (error: any) {
		throw new GraphQLError(error?.message, {
			extensions: {
				code: 'INTERNAL_SERVER_ERROR',
				http: { status: 500 },
			},
		});
	}
}
