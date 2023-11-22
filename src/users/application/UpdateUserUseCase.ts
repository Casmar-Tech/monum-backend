import { GraphQLError } from "graphql";
import { MongoUserModel } from "../infrastructure/mongoModel/MongoUserModel.js";
import axios from "axios";
import sharp from "sharp";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

interface UpdateUserUseCaseDTO {
  tokenUserId: string;
  id: string;
  username?: string;
  name?: string;
  photoBase64?: string;
  language?: string;
}

export default async function UpdateUserUserCase({
  tokenUserId,
  id,
  username,
  name,
  photoBase64,
  language,
}: UpdateUserUseCaseDTO) {
  if (tokenUserId !== id) {
    throw new GraphQLError("You can only update your own user", {
      extensions: {
        code: "UNAUTHENTICATED",
        http: { status: 401 },
      },
    });
  }
  let photo;
  if (photoBase64) {
    // Extract binary from the base64 string.
    const base64Data = photoBase64.replace(/^data:image\/\w+;base64,/, "");
    const dataBuffer = Buffer.from(base64Data, "base64");
    const imageResized = await sharp(dataBuffer)
      .resize(250, 250, {
        fit: "cover",
      })
      .toBuffer();
    const client = new S3Client({ region: "eu-west-1" });
    // Create a command to put a file into an S3 bucket.
    const commandToPut = new PutObjectCommand({
      Body: imageResized,
      Bucket: process.env.S3_BUCKET_IMAGES!,
      Key: id,
    });
    await client.send(commandToPut);
    // Create a command to get a file into an S3 bucket and then create a signed URL.
    const commandToGet = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_IMAGES!,
      Key: id,
    });
    console.log("commandToGet", commandToGet);
    const url = await getSignedUrl(client, commandToGet, { expiresIn: 3600 });
    photo = url;
  }
  return await MongoUserModel.findByIdAndUpdate(
    id,
    {
      username,
      name,
      photo,
      language,
    },
    { new: true }
  );
}
