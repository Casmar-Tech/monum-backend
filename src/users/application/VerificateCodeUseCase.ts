import { MongoUserModel } from "../infrastructure/mongoModel/MongoUserModel.js";
import { ApolloError } from "apollo-server-errors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export default async function VerificateCodeUseCase(
  code: string,
  email: string
): Promise<String> {
  try {
    const user = await MongoUserModel.findOne({
      email,
    });

    if (!user) {
      throw new ApolloError("User not found", "USER_NOT_FOUND");
    }

    const currentDate = new Date();

    if (
      user &&
      user.recoveryPasswordHashedCode &&
      (!user.recoveryPasswordCodeValidity ||
        user.recoveryPasswordCodeValidity.getTime() > currentDate.getTime()) &&
      (await bcrypt.compare(code, user.recoveryPasswordHashedCode))
    ) {
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
      user.save();
      return token;
    } else {
      throw new ApolloError("Incorrect code", "INCORRECT_CODE");
    }
  } catch (error) {
    console.error(error);
    throw new ApolloError(
      `Failed to verificate code: ${error}`,
      `FAILED_TO_VERIFICATE_CODE`
    );
  }
}
