import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Blob } from 'node:buffer'; // Asegúrate de que estás utilizando un entorno que soporte esta importación

const s3 = new S3Client({
	region: 'eu-west-1',
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID_MONUM!,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_MONUM!,
	},
});

export async function addPhotosToS3(
	photoName: string,
	photo: ArrayBuffer,
	size: string,
) {
	const buffer = Buffer.from(photo);
	const bucketName = 'monum-place-photos';
	const bucketParams = {
		Bucket: bucketName,
		Key: `${photoName}/${size}.jpg`,
		Body: buffer,
	};
	const data = await s3.send(new PutObjectCommand(bucketParams));
	console.log('Success. Photo uploaded to S3.', data);
}
