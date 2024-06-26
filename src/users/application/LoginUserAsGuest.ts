import { MongoUserModel } from "../infrastructure/mongoModel/MongoUserModel.js";
import { MongoRoleModel } from "../../roles/infrastructure/mongoModel/MongoRoleModel.js";
import { ApolloError } from "apollo-server-errors";
import jwt from "jsonwebtoken";
import GetRealPermissionsOfUser from "../../permissions/application/GetRealPermissionsOfUser.js";
import IUser from "../domain/IUser.js";

export default async function LoginUserAsGuest(
  deviceId: string,
  language: string
): Promise<IUser> {
  const role = await MongoRoleModel.findOne({ name: "guest" });
  if (!role) {
    throw new ApolloError("Guest role not found", "GUEST_ROLE_NOT_FOUND");
  }
  let user = await MongoUserModel.findOne({
    deviceId,
    roleId: role._id.toString(),
  });
  if (user) {
    const token = jwt.sign(
      {
        id: user.id,
        deviceId: user.deviceId,
      },
      process.env.SECRET_KEY!
    );
    user.token = token;
  } else {
    const newUser = new MongoUserModel({
      deviceId,
      roleId: role._id.toString(),
      language,
      createdAt: new Date(),
    });
    const token = jwt.sign(
      {
        id: newUser.id,
        deviceId: newUser.deviceId,
      },
      process.env.SECRET_KEY!
    );
    newUser.token = token;
    await newUser.save();
    user = newUser.toObject();
  }
  return user;
}
