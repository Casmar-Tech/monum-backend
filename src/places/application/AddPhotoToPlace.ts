import '../../connection.js';
import { Types } from 'mongoose';
import sharp from 'sharp';
import { MongoPlaceModel } from '../infrastructure/mongoModel/MongoPlaceModel';
import {
	LARGE_PHOTO_MAX_WIDTH_PX,
	MEDIUM_PHOTO_MAX_WIDTH_PX,
	ORIGINAL_PHOTO_MAX_WIDTH_PX,
	SMALL_PHOTO_MAX_WIDTH_PX,
} from '../infrastructure/s3/photos.js';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const s3 = new S3Client({
	region: 'eu-west-1',
});

const bucketName = process.env.S3_BUCKET_PLACES_IMAGES!;

export default async function AddImageToPlace(
	placeId: string,
	photoUrl: string,
	isMainPhoto: boolean,
): Promise<void> {
	console.log('AddImageToPlace');
	const place = await MongoPlaceModel.findById(placeId);
	if (!place) {
		throw new Error('Place not found');
	}
	const photoFetch = await fetch(photoUrl);
	const photoBuffer = await photoFetch.arrayBuffer();

	const id = new Types.ObjectId();

	const commonKey = `places/${place.googleId || placeId}/${id}`;

	const metadata = await sharp(photoBuffer).metadata();
	if (!metadata || !metadata.width || !metadata.height) {
		throw new Error('Error getting metadata from photo');
	}

	let photoDocument = {
		url: commonKey,
		width: metadata.width,
		height: metadata.height,
		sizes: {},
	};

	for (const size of ['original', 'small', 'medium', 'large']) {
		let width = 0;
		switch (size) {
			case 'small':
				width = SMALL_PHOTO_MAX_WIDTH_PX;
				break;
			case 'medium':
				width = MEDIUM_PHOTO_MAX_WIDTH_PX;
				break;
			case 'large':
				width = LARGE_PHOTO_MAX_WIDTH_PX;
				break;
			case 'original':
				width = ORIGINAL_PHOTO_MAX_WIDTH_PX;
				break;
		}

		const imageResized = sharp(photoBuffer).resize(width).jpeg();
		const buffer = await imageResized.toBuffer();

		const objectKey = `${commonKey}/${size}.jpeg`;

		const bucketParams = {
			Bucket: bucketName,
			Key: objectKey,
			Body: buffer,
		};

		await s3.send(new PutObjectCommand(bucketParams));

		console.log(`Photo for place ${placeId} with size ${size} added to S3`);

		photoDocument.sizes[size] = objectKey;
	}

	if (photoDocument) {
		if (isMainPhoto) {
			place.mainPhoto = photoDocument;
		} else {
			Array.isArray(place.photos) && place.photos.push(photoDocument);
		}
	}

	await place.save();
}

AddImageToPlace(
	'65b26b45d1565e2a20b046da',
	'https://estaticos-cdn.prensaiberica.es/clip/d831232f-3966-4003-993b-13d8f3ea5d86_alta-libre-aspect-ratio_default_0.jpg',
	true,
);
