import jwt from "jsonwebtoken";
import { MongoUserModel } from "../infrastructure/mongoModel/MongoUserModel.js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import axios from "axios";
import sharp from "sharp";
import { MongoRoleModel } from "../../roles/infrastructure/mongoModel/MongoRoleModel.js";
import { ApolloError } from "apollo-server-errors";
import IUser from "../domain/IUser.js";

interface LoginGoogleUserDTO {
  email: string;
  googleId: string;
  name?: string;
  photo?: string;
  language?: string;
}

export default async function rLoginGoogleUserUseCase({
  email,
  name,
  googleId,
  photo,
  language,
}: LoginGoogleUserDTO): Promise<IUser> {
  try {
    let user = await MongoUserModel.findOne({ email });
    if (!user) {
      let defaultRoleId;
      const defaultRole = await MongoRoleModel.findOne({ name: "tourist" });
      if (!defaultRole) {
        throw new ApolloError(
          "Default role not found",
          "DEFAULT_ROLE_NOT_FOUND"
        );
      }
      defaultRoleId = defaultRole.id;

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
        name: name || username,
        username,
        email,
        googleId,
        createdAt: new Date(),
        language: language || "en_US",
        roleId: defaultRoleId,
        thirdPartyAccount: "google",
      });
    }
    if (!user.email || !user.username) {
      throw new ApolloError(
        "User email and username is required",
        "USER_EMAIL_AND_USERNAME_REQUIRED"
      );
    }

    const token = jwt.sign(
      { id: user.id, email: user.email.toLowerCase(), username: user.username },
      process.env.SECRET_KEY!
    );
    user.token = token;

    // If the user has already a photo, we don't need to upload it again
    if (!user.photo && photo) {
      // If the user doesn't have a photo, we need to upload it
      const image = await axios.get(photo, { responseType: "arraybuffer" });
      const imageResized = await sharp(image.data)
        .resize(250, 250, {
          fit: "cover",
        })
        .toBuffer();
      const client = new S3Client({
        region: "eu-west-1",
      });
      // Create a command to put a file into an S3 bucket.
      const commandToPut = new PutObjectCommand({
        Body: imageResized,
        Bucket: process.env.S3_BUCKET_IMAGES!,
        Key: user.id,
      });
      await client.send(commandToPut);
      user.photo = `https://${process.env.S3_BUCKET_IMAGES}.s3.amazonaws.com/${user.id}`;
    }
    await user.save();
    return user.toObject();
  } catch (error) {
    console.log("error", error);
    throw error;
  }
}
