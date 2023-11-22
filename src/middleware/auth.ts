import { GraphQLError } from "graphql";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import IUser from "../users/domain/IUser";

dotenv.config();

const SECRET_KEY = process.env.SECRET_KEY!;

export const checkToken = (token: string): IUser => {
  if (!token) {
    throw new GraphQLError("No token provided", {
      extensions: {
        code: "UNAUTHENTICATED",
        http: { status: 401 },
      },
    });
  }

  try {
    const user = jwt.verify(token, SECRET_KEY);
    return user as IUser;
  } catch (error) {
    throw new GraphQLError("User is not authenticated", {
      extensions: {
        code: "UNAUTHENTICATED",
        http: { status: 401 },
      },
    });
  }
};
