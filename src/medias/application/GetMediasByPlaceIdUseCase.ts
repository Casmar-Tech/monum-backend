import { MongoMediaModel } from '../infrastructure/mongoModel/MongoMediaModel.js';
import { IMediaTranslated } from '../domain/IMedia.js';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import GetUserByIdUseCase from '../../users/application/GetUserByIdUseCase.js';

export default async function GetMediasByPlaceIdUseCase(
	userId: string,
	placeId: string,
): Promise<IMediaTranslated[]> {
	const user = await GetUserByIdUseCase(userId);
	const query = { duration: { $exists: true } };
	if (placeId) {
		Object.assign(query, { 'place._id': placeId });
	}
	const medias = await MongoMediaModel.find(query);
	return medias.map((media) => media.getTranslatedVersion(user.language));
}
