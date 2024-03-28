import LoginGoogleUserUseCase from "../../application/LoginGoogleUserUseCase.js";
import LoginUserUseCase from "../../application/LoginUserUseCase.js";
import RegisterUserUseCase from "../../application/RegisterUserUseCase.js";
import UpdateUserUseCase from "../../application/UpdateUserUseCase.js";
import UpdatePasswordUseCase from "../../application/UpdatePasswordUseCase.js";
import GetUserByIdUseCase from "../../application/GetUserByIdUseCase.js";
import GetAllUsersUseCase from "../../application/GetAllUsersUseCase.js";
import ResetPasswordUseCase from "../../application/ResetPasswordUseCase.js";
import VerificateCodeUseCase from "../../application/VerificateCodeUseCase.js";
import UpdatePasswordWithoutOldUseCase from "../../application/UpdatePasswordWithoutOldUseCase.js";
import CreateNonExpiringToken from "../../application/CreateNonExpiringToken.js";
import LoginUserAsGuest from "../../application/LoginUserAsGuest.js";
import { GraphQLScalarType, Kind } from "graphql";
import { checkToken } from "../../../middleware/auth.js";
import IUser from "../../domain/IUser.js";
import {
  GetObjectCommand,
  HeadObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ApolloError } from "apollo-server-errors";
import { Languages } from "../../../shared/Types.js";

interface RegisterInput {
  registerInput: {
    username?: string;
    email: string;
    password: string;
    language?: string;
    roleId: string;
    organizationId: string;
  };
}

interface LoginInput {
  loginInput: {
    emailOrUsername: string;
    password: string;
  };
}

interface LoginGoogleInput {
  loginGoogleInput: {
    email: string;
    googleId: string;
    name: string;
    photo: string;
    language?: string;
  };
}

interface UpdateUserInput {
  updateUserInput: {
    id: string;
    username?: string;
    name?: string;
    photoBase64?: string;
    language?: Languages;
  };
}

interface ResetPasswordInput {
  resetPasswordInput: {
    email: string;
    resend: boolean;
  };
}

interface VerificateCodeInput {
  verificateCodeInput: {
    code: string;
    email: string;
  };
}

interface UpdatePasswordWithoutOldInput {
  updatePasswordWithoutOldInput: {
    newPassword: string;
    token: string;
  };
}

interface LoginAsGuestInput {
  deviceId: string;
  language: string;
}

const resolvers = {
  User: {
    hasPassword: (parent: IUser) => parent.hashedPassword !== undefined,
    photo: async (parent: IUser) => {
      const client = new S3Client({
        region: "eu-west-1",
      });

      const commandToCheck = new HeadObjectCommand({
        Bucket: process.env.S3_BUCKET_IMAGES!,
        Key: parent.id || parent._id?.toString() || "",
      });

      try {
        await client.send(commandToCheck);

        const commandToGet = new GetObjectCommand({
          Bucket: process.env.S3_BUCKET_IMAGES!,
          Key: parent.id || parent._id?.toString() || "",
        });

        const url = await getSignedUrl(client, commandToGet, {
          expiresIn: 3600 * 24,
        });
        return url;
      } catch (error) {
        return null;
      }
    },
  },
  Mutation: {
    registerUser: async (
      parent: any,
      {
        registerInput: {
          username,
          email,
          password,
          language,
          roleId,
          organizationId,
        },
      }: RegisterInput
    ) => {
      return RegisterUserUseCase({
        username,
        email,
        password,
        language,
        roleId,
        organizationId,
      });
    },
    loginUser: async (
      parent: any,
      { loginInput: { emailOrUsername, password } }: LoginInput
    ) => {
      return LoginUserUseCase({ emailOrUsername, password });
    },
    loginGoogleUser: async (
      parent: any,
      {
        loginGoogleInput: { email, googleId, name, photo, language },
      }: LoginGoogleInput
    ) => {
      return LoginGoogleUserUseCase({ email, googleId, name, photo, language });
    },
    loginUserAsGuest: async (
      parent: any,
      { deviceId, language }: LoginAsGuestInput
    ) => {
      return LoginUserAsGuest(deviceId, language);
    },
    updateUser: async (
      parent: any,
      {
        updateUserInput: { id, username, photoBase64, language },
      }: UpdateUserInput,
      { token }: { token: string }
    ) => {
      const user = checkToken(token);
      return UpdateUserUseCase({
        tokenUserId: user.id || "",
        id,
        username,
        photoBase64,
        language,
      });
    },
    updatePassword: async (
      parent: any,
      {
        oldPassword,
        newPassword,
      }: { oldPassword: string; newPassword: string },
      { token }: { token: string }
    ) => {
      const user = checkToken(token);
      return (
        (await UpdatePasswordUseCase({
          userId: user.id || "",
          oldPassword,
          newPassword,
        })) && true
      );
    },
    resetPassword: async (
      parent: any,
      { resetPasswordInput: { email, resend } }: ResetPasswordInput
    ) => {
      return ResetPasswordUseCase(email, resend);
    },
    verificateCode: async (
      parent: any,
      { verificateCodeInput: { code, email } }: VerificateCodeInput
    ) => {
      return VerificateCodeUseCase(code, email);
    },
    updatePasswordWithoutOld: async (
      parent: any,
      {
        updatePasswordWithoutOldInput: { newPassword, token },
      }: UpdatePasswordWithoutOldInput
    ) => {
      const { id: userId } = checkToken(token);
      if (!userId) throw new ApolloError("User not found", "USER_NOT_FOUND");
      return (
        (await UpdatePasswordWithoutOldUseCase(userId, newPassword)) && true
      );
    },
    createNonExpiringToken: async (
      parent: any,
      { loginInput: { emailOrUsername, password } }: LoginInput
    ) => {
      return CreateNonExpiringToken({ emailOrUsername, password });
    },
  },
  Query: {
    user: async (parent: any, args: any, { token }: { token: string }) => {
      const { id: userId } = checkToken(token);
      if (!userId) throw new ApolloError("User not found", "USER_NOT_FOUND");
      return GetUserByIdUseCase(userId);
    },
    users: async (parent: any, args: any, { token }: { token: string }) => {
      const { id: userId } = checkToken(token);
      if (!userId) throw new ApolloError("User not found", "USER_NOT_FOUND");
      return GetAllUsersUseCase();
    },
    verifyToken: async (
      parent: any,
      args: any,
      { token }: { token: string }
    ) => {
      return checkToken(token) ? true : false;
    },
  },

  DateTime: new GraphQLScalarType({
    name: "DateTime",
    description: "Una fecha y hora, representada como una cadena ISO-8601",
    serialize(value: unknown): string {
      if (!(value instanceof Date)) {
        throw new Error("El valor no es una instancia de Date");
      }
      return value.toISOString();
    },
    parseValue(value: unknown): Date {
      if (!(value instanceof Date)) {
        throw new Error("El valor no es una instancia de Date");
      }
      return new Date(value); // Recibe la fecha del cliente
    },
    parseLiteral(ast): Date | null {
      if (ast.kind === Kind.STRING) {
        return new Date(ast.value); // Recibe la fecha del AST
      }
      return null;
    },
  }),
};

export default resolvers;
