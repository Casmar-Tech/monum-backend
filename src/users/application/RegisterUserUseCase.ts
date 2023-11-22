import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { MongoUserModel } from "../infrastructure/mongoModel/MongoUserModel.js";
import { ApolloError } from "apollo-server-errors";

interface RegisterUserDTO {
  email: string;
  password: string;
  username?: string;
  language?: string;
}

export default async function RegisterUserUseCase({
  email,
  password,
  username,
  language,
}: RegisterUserDTO) {
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
  //Encrypt password
  const encryptedPassword = await bcrypt.hash(password, 10);
  // Build out mongoose model (User)
  const newUser = new MongoUserModel({
    username,
    email: email.toLowerCase(),
    hashedPassword: encryptedPassword,
    isTemporalPassword: false,
    createdAt: new Date(),
    language: language || "en_US",
  });
  // Create JWT
  const token = jwt.sign(
    { id: newUser.id, email: email.toLowerCase(), username },
    process.env.SECRET_KEY!,
    { expiresIn: "1d" }
  );
  newUser.token = token;
  return newUser.save();
}
