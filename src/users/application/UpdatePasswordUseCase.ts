import bcrypt from "bcryptjs";
import { MongoUserModel } from "../infrastructure/mongoModel/MongoUserModel.js";
import { ApolloError } from "apollo-server-errors";
import { isStrongPassword } from "./utils/utils.js";
interface UpdatePasswordUseCaseDTO {
  userId: string;
  oldPassword: string;
  newPassword: string;
}

export default async function UpdatePasswordUseCase({
  userId,
  oldPassword,
  newPassword,
}: UpdatePasswordUseCaseDTO) {
  const userToUpdate = await MongoUserModel.findById(userId);
  if (
    userToUpdate &&
    userToUpdate.hashedPassword &&
    (await bcrypt.compare(oldPassword, userToUpdate.hashedPassword))
  ) {
    if (isStrongPassword(newPassword) === false) {
      throw new ApolloError(
        "The password must match the requirements",
        "passwordNotStrong"
      );
    }
    const encryptedPassword = await bcrypt.hash(newPassword, 10);
    userToUpdate.hashedPassword = encryptedPassword;
    return userToUpdate.save();
  } else {
    // If user doesn't exist or it was created by google (without password) or password is incorrect throw error
    throw new ApolloError("Incorrect password", "incorrectPassword");
  }
}
