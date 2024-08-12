import jwt from "jsonwebtoken";
import { MongoUserModel } from "../infrastructure/mongoModel/MongoUserModel.js";
import { MongoRoleModel } from "../../roles/infrastructure/mongoModel/MongoRoleModel.js";
import { ApolloError } from "apollo-server-errors";
import IUser from "../domain/IUser.js";
import appleSignin from "apple-signin-auth";
import crypto from "crypto";

interface LoginAppleUserDTO {
  nonce: string;
  user: string;
  name?: string;
  identityToken: string;
  email?: string;
  language?: string;
}

export default async function LoginAppleUserUseCase({
  nonce,
  name,
  identityToken,
  email,
  language,
}: LoginAppleUserDTO): Promise<IUser> {
  try {
    const cryptoNonce = nonce
      ? crypto.createHash("sha256").update(nonce).digest("hex")
      : undefined;
    const appleUser = await appleSignin.verifyIdToken(identityToken, {
      audience: "es.monum.mobile",
      nonce: cryptoNonce,
      ignoreExpiration: true,
    });
    let user = await MongoUserModel.findOne({
      thirdPartyEmail: appleUser.email,
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
