import bcrypt from "bcryptjs";
import { MongoUserModel } from "../infrastructure/mongoModel/MongoUserModel.js";
import { ApolloError } from "apollo-server-errors";
import { isStrongPassword } from "./utils/utils.js";
import IUser from "../domain/IUser.js";

export default async function UpdatePasswordWithoutOldUseCase(
  userId: string,
  newPassword: string
): Promise<IUser> {
  const user = await MongoUserModel.findById(userId);
  if (!user) {
    throw new ApolloError("User not found", "USER_NOT_FOUND");
  }
  if (isStrongPassword(newPassword) === false) {
    throw new ApolloError(
      "The password must match the requirements",
      "passwordNotStrong"
    );
  }
  const encryptedPassword = await bcrypt.hash(newPassword, 10);
  user.hashedPassword = encryptedPassword;

  return user.save();
}
