import jwt from "jsonwebtoken";
import { MongoUserModel } from "../infrastructure/mongoModel/MongoUserModel.js";
import IUser from "../domain/IUser.js";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import axios from "axios";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import sharp from "sharp";

interface LoginGoogleUserDTO {
  email: string;
  googleId: string;
  name?: string;
  photo?: string;
  language?: string;
}

export default async function LoginGoogleUserUseCase({
  email,
  name,
  googleId,
  photo,
  language,
}: LoginGoogleUserDTO): Promise<IUser> {
  let user = await MongoUserModel.findOne({ email });
  if (!user) {
    let userIsAlreadyTaken = true;
    let username = email.split("@")[0];
    while (userIsAlreadyTaken) {
      if (await MongoUserModel.findOne({ username })) {
        username = username + "1";
      } else {
        userIsAlreadyTaken = false;
      }
    }
    user = new MongoUserModel({
      name,
      username,
      email,
      googleId,
      createdAt: new Date(),
      language: language || "en_US",
    });
  }
  const token = jwt.sign(
    { id: user.id, email: user.email.toLowerCase(), username: user.username },
    process.env.SECRET_KEY!,
    {
      expiresIn: "1d",
    }
  );
  user.token = token;

  // If the user has already a photo, we don't need to upload it again
  if (user.photo) {
    const client = new S3Client({ region: "eu-west-1" });
    const commandToGet = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_IMAGES!,
      Key: user.id,
    });
    const url = await getSignedUrl(client, commandToGet, {
      expiresIn: 3600 * 24,
    }); // 1 day
    user.photo = url;
  } else if (photo) {
    // If the user doesn't have a photo, we need to upload it
    const image = await axios.get(photo, { responseType: "arraybuffer" });
    const imageResized = await sharp(image.data)
      .resize(250, 250, {
        fit: "cover",
      })
      .toBuffer();
    const client = new S3Client({ region: "eu-west-1" });
    // Create a command to put a file into an S3 bucket.
    const commandToPut = new PutObjectCommand({
      Body: imageResized,
      Bucket: process.env.S3_BUCKET_IMAGES!,
      Key: user.id,
    });
    await client.send(commandToPut);
    // Create a command to get a file into an S3 bucket and then create a signed URL.
    const commandToGet = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_IMAGES!,
      Key: user.id,
    });
    const url = await getSignedUrl(client, commandToGet, {
      expiresIn: 3600 * 24,
    }); // 1 day
    user.photo = url;
  }
  return user.save();
}
