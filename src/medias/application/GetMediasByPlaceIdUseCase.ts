import { MongoMediaModel } from "../infrastructure/mongoModel/MongoMediaModel.js";
import { IMediaSimplified } from "../domain/IMedia.js";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import GetUserByIdUseCase from "../../users/application/GetUserByIdUseCase.js";

export default async function GetMediasByPlaceIdUseCase(
  userId: string,
  placeId: string
): Promise<IMediaSimplified[]> {
  const user = await GetUserByIdUseCase(userId);
  const query = { duration: { $exists: true } };
  if (placeId) {
    Object.assign(query, { "place._id": placeId });
  }
  const medias = await MongoMediaModel.find(query);
  for (const media of medias) {
    const client = new S3Client({ region: "eu-west-1" });
    const commandToGet = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_AUDIOS!,
      Key: media.audioUrl[user.language],
    });
    const url = await getSignedUrl(client, commandToGet, {
      expiresIn: 3600,
    }); // 1 hour
    media.audioUrl[user.language] = url;
  }
  return medias.map((media) => media.getSimplifiedVersion(user.language));
}
