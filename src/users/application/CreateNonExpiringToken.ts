import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import IUser from "../domain/IUser.js";
import { MongoUserModel } from "../infrastructure/mongoModel/MongoUserModel.js";
import { ApolloError } from "apollo-server-errors";

interface CreateNonExpiringTokenDTO {
  emailOrUsername: string;
  password: string;
}

export default async function CreateNonExpiringToken({
  emailOrUsername,
  password,
}: CreateNonExpiringTokenDTO): Promise<IUser> {
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
        email: user.email.toLowerCase(),
        username: user.username,
      },
      process.env.SECRET_KEY!
    );
    return { ...user.toObject(), token };
  } else {
    // If user doesn't exist or it was created by google (without password) or password is incorrect throw error
    throw new ApolloError("Incorrect password", "INCORRECT_PASSWORD");
  }
}
