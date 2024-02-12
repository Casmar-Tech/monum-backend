import {
	S3Client,
	PutObjectCommand,
	HeadObjectCommand,
	ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { ImageSize } from '../../domain/types/ImageTypes.js';

// Define constants for photo sizes
export const SMALL_PHOTO_MAX_WIDTH_PX = 400;
export const MEDIUM_PHOTO_MAX_WIDTH_PX = 1200;
export const LARGE_PHOTO_MAX_WIDTH_PX = 2400;
export const ORIGINAL_PHOTO_MAX_WIDTH_PX = 4800;

const s3 = new S3Client({
	region: 'eu-west-1',
});

const bucketName = process.env.S3_BUCKET_PLACES_IMAGES!;

export async function addPhotosToS3(
	photoName: string,
	photo: ArrayBuffer,
	size: string,
) {
	try {
		const buffer = Buffer.from(photo);

		const objectKey = `${photoName}/${size}.jpg`;

		// Optional: Check if the object already exists in S3
		const objectExists = await checkIfObjectExists(bucketName, objectKey);
		if (objectExists) {
			console.log(
				`The object ${objectKey} already exists in the bucket ${bucketName}. It will be replaced.`,
			);
			// If you decide not to overwrite the existing object, return here
			return;
		}

		const bucketParams = {
			Bucket: bucketName,
			Key: objectKey,
			Body: buffer,
		};

		await s3.send(new PutObjectCommand(bucketParams));
	} catch (error) {
		console.log(error);
	}
}

export async function checkIfObjectExists(
	bucketName: string,
	objectKey: string,
): Promise<boolean> {
	try {
		await s3.send(
			new HeadObjectCommand({
				Bucket: bucketName,
				Key: objectKey,
			}),
		);
		return true; // The object exists
	} catch (error) {
		return false; // The object does not exist or there was an error in the verification
	}
}

export async function listAllPhotos(
	bucket: string,
	key: string,
	size: ImageSize,
): Promise<string[]> {
	const params = {
		Bucket: bucket,
		Prefix: key,
	};
	const data = await s3.send(new ListObjectsV2Command(params));
	if (!Array.isArray(data.Contents)) return [];
	const allKeys = data.Contents?.map((content) => content.Key || '');
	const keysFiltered = allKeys?.filter((key) => key?.includes(size));
	return keysFiltered || [];
}
