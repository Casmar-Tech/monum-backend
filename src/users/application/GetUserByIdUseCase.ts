import { MongoUserModel } from "../infrastructure/mongoModel/MongoUserModel.js";
import IUser from "../domain/IUser.js";
import { ApolloError } from "apollo-server-errors";

export default async function GetUserByIdUseCase(id: string): Promise<IUser> {
  const user = await MongoUserModel.findById(id);
  if (!user) {
    throw new ApolloError("User not found", "USER_NOT_FOUND");
  }
  return user.toObject();
}
