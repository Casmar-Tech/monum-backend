import { MongoMediaModel } from "../infrastructure/mongoModel/MongoMediaModel.js";
import IMedia from "../domain/IMedia.js";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export default async function GetMediasByPlaceIdUseCase(
  placeId: string,
  language: string
): Promise<IMedia[]> {
  const query = { duration: { $exists: true } };
  if (placeId) {
    Object.assign(query, { "place._id": placeId });
  }
  if (language) {
    Object.assign(query, { language: language.replace("_", "-") });
  }
  const medias = await MongoMediaModel.find(query);
  for (const media of medias) {
    const client = new S3Client({ region: "eu-west-1" });
    const parsedUrl = new URL(media.audioUrl);
    const s3Key = parsedUrl.pathname.replace(
      `/${process.env.S3_BUCKET_AUDIOS!}/`,
      ""
    );
    const commandToGet = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_AUDIOS!,
      Key: s3Key,
    });
    const url = await getSignedUrl(client, commandToGet, {
      expiresIn: 3600,
    }); // 1 hour
    media.audioUrl = url;
  }
  return medias;
}
