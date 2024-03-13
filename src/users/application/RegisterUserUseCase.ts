import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { MongoUserModel } from "../infrastructure/mongoModel/MongoUserModel.js";
import { ApolloError } from "apollo-server-errors";
import { isStrongPassword } from "./utils/utils.js";
import { MongoRoleModel } from "../../roles/infrastructure/mongoModel/MongoRoleModel.js";
import GetRealPermissionsOfUser from "../../permissions/application/GetRealPermissionsOfUser.js";
import IUserWithPermissions from "../domain/IUserWithPermissions.js";

interface RegisterUserDTO {
  email: string;
  password: string;
  username?: string;
  language?: string;
  roleId: string;
  organizationId?: string;
}

export default async function RegisterUserUseCase({
  email,
  password,
  username,
  language,
  roleId,
  organizationId,
}: RegisterUserDTO): Promise<IUserWithPermissions> {
  let roleIdToRegister;
  if (roleId) {
    roleIdToRegister = roleId;
  } else {
    const defaultRole = await MongoRoleModel.findOne({ name: "tourist" });
    if (!defaultRole)
      throw new ApolloError("Default role not found", "DEFAULT_ROLE_NOT_FOUND");
    roleIdToRegister = defaultRole.id;
  }
  // See if an old user exists with email attempting to register
  if (await MongoUserModel.findOne({ email })) {
    throw new ApolloError(
      `A user is already registered with the email ${email}`,
      `USER_ALREADY_EXISTS`
    );
  }
  // Create a username based in the email in case we dont have it
  if (!username) {
    let usernameIsAlreadyTaken = true;
    username = email.split("@")[0];
    while (usernameIsAlreadyTaken) {
      if (await MongoUserModel.findOne({ username })) {
        username = username + "1";
      } else {
        usernameIsAlreadyTaken = false;
      }
    }
  }

  if (isStrongPassword(password) === false) {
    throw new ApolloError(
      "The password must match the requirements",
      "PASSWORD_NOT_STRONG"
    );
  }
  //Encrypt password
  const encryptedPassword = await bcrypt.hash(password, 10);
  // Build out mongoose model (User)
  const newUser = new MongoUserModel({
    username,
    email: email.toLowerCase(),
    hashedPassword: encryptedPassword,
    createdAt: new Date(),
    language: language || "en_US",
    roleId: roleIdToRegister,
    organizationId,
  });
  // Create JWT
  const token = jwt.sign(
    { id: newUser.id, email: email.toLowerCase(), username },
    process.env.SECRET_KEY!,
    { expiresIn: "1d" }
  );
  newUser.token = token;
  await newUser.save();
  const userWithPermissions = newUser.toObject() as IUserWithPermissions;
  const realPermissions = await GetRealPermissionsOfUser(
    newUser._id.toString()
  );
  userWithPermissions.permissions = realPermissions;
  return userWithPermissions;
}
