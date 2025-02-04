import jwt from "jsonwebtoken";
import { MongoUserModel } from "../infrastructure/mongoModel/MongoUserModel.js";
import { MongoRoleModel } from "../../roles/infrastructure/mongoModel/MongoRoleModel.js";
import { ApolloError } from "apollo-server-errors";
import IUser from "../domain/IUser.js";
import appleSignin from "apple-signin-auth";
import crypto from "crypto";

interface LoginAppleUserDTO {
  nonce?: string;
  name?: string;
  identityToken: string;
  email?: string;
  language?: string;
}

export default async function LoginAppleUserUseCase({
  name,
  identityToken,
  email,
  language,
}: LoginAppleUserDTO): Promise<IUser> {
  try {
    const appleUser = await appleSignin.verifyIdToken(identityToken);
    email = email || appleUser.email;
    let user = await MongoUserModel.findOne({
      $or: [{ thirdPartyEmail: appleUser.email }, { email: email }],
    });
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
      user = new MongoUserModel({
        name: name || appleUser.email.split("@")[0],
        username: name || appleUser.email.split("@")[0],
        email,
        thirdPartyEmail: appleUser.email,
        thirdPartyAccount: "apple",
        createdAt: new Date(),
        language: language || "en_US",
        roleId: defaultRoleId,
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email
          ? user.email.toLowerCase()
          : appleUser.email.toLowerCase(),
        username: user.username,
      },
      process.env.SECRET_KEY!
    );
    user.token = token;

    await user.save();
    return user.toObject();
  } catch (error) {
    console.log("error", error);
    throw error;
  }
}
