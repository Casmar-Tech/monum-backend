import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import IUser from "../domain/IUser.js";
import { MongoUserModel } from "../infrastructure/mongoModel/MongoUserModel.js";
import { ApolloError } from "apollo-server-errors";

interface LoginUserDTO {
  emailOrUsername: string;
  password: string;
}

export default async function LoginUserUseCase({
  emailOrUsername,
  password,
}: LoginUserDTO): Promise<IUser> {
  // See if the user exists with the email
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
      process.env.SECRET_KEY!,
      { expiresIn: "1d" }
    );

    user.token = token;
    return user;
  } else {
    // If user doesn't exist or it was created by google (without password) or password is incorrect throw error
    throw new ApolloError("Incorrect password", "INCORRECT_PASSWORD");
  }
}
