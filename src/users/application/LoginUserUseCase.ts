import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { MongoUserModel } from "../infrastructure/mongoModel/MongoUserModel.js";
import { ApolloError } from "apollo-server-errors";
import IUserWithPermissions from "../domain/IUserWithPermissions.js";
import GetRealPermissionsOfUser from "../../permissions/application/GetRealPermissionsOfUser.js";

interface LoginUserDTO {
  emailOrUsername: string;
  password: string;
}

export default async function LoginUserUseCase({
  emailOrUsername,
  password,
}: LoginUserDTO): Promise<IUserWithPermissions> {
  const user = await MongoUserModel.findOne({
    $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
  });

  // Check if the entered password equals the encrypted password
  if (
    user &&
    user.hashedPassword &&
    (await bcrypt.compare(password, user.hashedPassword))
  ) {
    // Create a new JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email?.toLowerCase(),
        username: user.username,
      },
      process.env.SECRET_KEY!
    );

    user.token = token;
    const realPermissions = await GetRealPermissionsOfUser(user._id.toString());
    const userWithPermissions = { ...user, permissions: realPermissions };
    return userWithPermissions;
  } else {
    // If user doesn't exist or it was created by google (without password) or password is incorrect throw error
    throw new ApolloError("Incorrect password", "INCORRECT_PASSWORD");
  }
}
