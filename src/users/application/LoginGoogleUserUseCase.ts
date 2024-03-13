import jwt from "jsonwebtoken";
import { MongoUserModel } from "../infrastructure/mongoModel/MongoUserModel.js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import axios from "axios";
import sharp from "sharp";
import IUserWithPermissions from "../domain/IUserWithPermissions.js";
import GetRealPermissionsOfUser from "../../permissions/application/GetRealPermissionsOfUser.js";
import { MongoRoleModel } from "../../roles/infrastructure/mongoModel/MongoRoleModel.js";
import { ApolloError } from "apollo-server-errors";

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
}: LoginGoogleUserDTO): Promise<IUserWithPermissions> {
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
        name,
        username,
        email,
        googleId,
        createdAt: new Date(),
        language: language || "en_US",
        roleId: defaultRoleId,
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
    const userWithPermissions = user.toObject() as IUserWithPermissions;
    const realPermissions = await GetRealPermissionsOfUser(user._id.toString());
    userWithPermissions.permissions = realPermissions;
    return userWithPermissions;
  } catch (error) {
    console.log("error", error);
    throw error;
  }
}
