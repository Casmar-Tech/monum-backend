import { MongoMediaModel } from '../infrastructure/mongoModel/MongoMediaModel.js';
import { IMediaSimplified } from '../domain/IMedia.js';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { GraphQLError } from 'graphql';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import GetUserByIdUseCase from '../../users/application/GetUserByIdUseCase.js';

export default async function GetMediaByIdUseCase(
	id: string,
	userId: string,
): Promise<IMediaSimplified> {
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
		const client = new S3Client({
			region: 'eu-west-1',
			credentials: {
				accessKeyId: process.env.AWS_ACCESS_KEY_ID_MONUM!,
				secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_MONUM!,
			},
		});
		const commandToGet = new GetObjectCommand({
			Bucket: process.env.S3_BUCKET_AUDIOS!,
			Key: media.audioUrl['en_US'],
		});
		const url = await getSignedUrl(client, commandToGet, {
			expiresIn: 3600,
		}); // 1 hour
		media.audioUrl[user.language] = url;
		return media.getSimplifiedVersion(user.language);
	} catch (error: any) {
		throw new GraphQLError(error?.message, {
			extensions: {
				code: 'INTERNAL_SERVER_ERROR',
				http: { status: 500 },
			},
		});
	}
}
