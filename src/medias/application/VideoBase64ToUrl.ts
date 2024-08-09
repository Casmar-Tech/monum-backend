import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { ApolloError } from "apollo-server-errors";

export default async function VideoBase64ToUrl(
  placeId: string,
  mediaId: string,
  language: string,
  videoBase64: string
): Promise<string> {
  const s3Client = new S3Client({ region: "eu-west-1" });
  const binaryData = Buffer.from(videoBase64, "base64");
  try {
    const s3Key = `${placeId}/${language}/${mediaId}`;

    const params = {
      Bucket: process.env.S3_BUCKET_AUDIOS!,
      Key: s3Key,
      Body: binaryData,
      ContentType: "video/mp4",
    };

    const response = await s3Client.send(new PutObjectCommand(params));
    if (response.$metadata.httpStatusCode === 200 && s3Key) {
      return s3Key;
    } else {
      throw new ApolloError(
        "Something went wrong while video was being created",
        "ERROR_WHILE_VIDEO_WAS_BEING_CREATED"
      );
    }
  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw new Error("Failed to upload to S3");
  }
}
