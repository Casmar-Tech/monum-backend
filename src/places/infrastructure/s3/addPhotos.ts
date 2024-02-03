import {
	S3Client,
	PutObjectCommand,
	HeadObjectCommand,
} from '@aws-sdk/client-s3';

const s3 = new S3Client({
	region: 'eu-west-1',
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID_MONUM!,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_MONUM!,
	},
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

async function checkIfObjectExists(
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
