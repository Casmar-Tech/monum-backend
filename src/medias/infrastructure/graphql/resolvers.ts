import DeleteMediaAndUpdatedAssociatedRoutesUseCase from '../../application/DeleteMediaAndUpdatedAssociatedRoutesUseCase.js';
import GetMediaByIdUseCase from '../../application/GetMediaByIdUseCase.js';
import GetMediasByPlaceIdUseCase from '../../application/GetMediasByPlaceIdUseCase.js';
import TranslateMedia from '../../application/TranslateMedia.js';
import UpdateMediaAndAssociatedRoutesUseCase from '../../application/UpdateMediaAndAssociatedRoutesUseCase.js';
import { IMedia, IMediaTranslated } from '../../domain/IMedia';
import { checkToken } from '../../../middleware/auth.js';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const resolvers = {
	Media: {
		audioUrl: async (parent: IMediaTranslated) => {
			const client = new S3Client({
				region: 'eu-west-1',
				credentials: {
					accessKeyId: process.env.AWS_ACCESS_KEY_ID_MONUM!,
					secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_MONUM!,
				},
			});
			const commandToGet = new GetObjectCommand({
				Bucket: process.env.S3_BUCKET_AUDIOS!,
				Key: parent.audioUrl,
			});
			const url = await getSignedUrl(client, commandToGet, {
				expiresIn: 3600,
			});
			return url;
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
