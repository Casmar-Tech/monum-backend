import DeleteMediaAndUpdatedAssociatedRoutesUseCase from '../../application/DeleteMediaAndUpdatedAssociatedRoutesUseCase.js';
import GetMediaByIdUseCase from '../../application/GetMediaByIdUseCase.js';
import GetMediasByPlaceIdUseCase from '../../application/GetMediasByPlaceIdUseCase.js';
import TranslateMedia from '../../application/TranslateMedia.js';
import UpdateMediaAndAssociatedRoutesUseCase from '../../application/UpdateMediaAndAssociatedRoutesUseCase.js';
import { IMedia, IMediaTranslated } from '../../domain/IMedia';
import { checkToken } from '../../../middleware/auth.js';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import mm from 'music-metadata';
import { Readable } from 'stream';

const client = new S3Client({
	region: 'eu-west-1',
});

const resolvers = {
	Media: {
		audioUrl: async (parent: IMediaTranslated) => {
			const commandToGet = new GetObjectCommand({
				Bucket: process.env.S3_BUCKET_AUDIOS!,
				Key: parent.audioUrl,
			});
			const url = await getSignedUrl(client, commandToGet, {
				expiresIn: 3600,
			});
			return url;
		},
		duration: async (parent: IMediaTranslated) => {
			try {
				const { Body } = await client.send(
					new GetObjectCommand({
						Bucket: process.env.S3_BUCKET_AUDIOS!,
						Key: parent.audioUrl,
					}),
				);
				if (!Body) return 0;
				const chunks = [];
				if (Body instanceof Readable) {
					for await (const chunk of Body) {
						chunks.push(chunk);
					}
				}
				const buffer = Buffer.concat(chunks);
				const metadata = await mm.parseBuffer(buffer, {
					mimeType: 'audio/mpeg',
					size: buffer.length,
				});
				return metadata.format.duration;
			} catch (error) {
				console.log(error);
				return 0;
			}
		},
	},
	Mutation: {
		translateMedia: async (
			parent: any,
			args: { id: string; outputLanguage: any },
			{ token }: { token: string },
		) => {
			checkToken(token);
			return TranslateMedia(args.id, args.outputLanguage);
		},
		updateMedia: (
			parent: any,
			args: { id: string; mediaUpdate: Partial<IMedia> },
			{ token }: { token: string },
		) => {
			checkToken(token);
			return UpdateMediaAndAssociatedRoutesUseCase(args.id, args.mediaUpdate);
		},
		deleteMedia: (
			parent: any,
			args: { id: string },
			{ token }: { token: string },
		) => {
			checkToken(token);
			return DeleteMediaAndUpdatedAssociatedRoutesUseCase(args.id);
		},
	},
	Query: {
		media: (
			parent: any,
			{ id }: { id: string },
			{ token }: { token: string },
		) => {
			const { id: userId } = checkToken(token);
			if (!userId) throw new Error('User not found');
			return GetMediaByIdUseCase(id, userId);
		},
		medias: async (
			parent: any,
			args: { placeId: string },
			{ token }: { token: string },
		) => {
			const { id: userId } = checkToken(token);
			if (!userId) throw new Error('User not found');
			return GetMediasByPlaceIdUseCase(userId, args.placeId);
		},
	},
};

export default resolvers;
