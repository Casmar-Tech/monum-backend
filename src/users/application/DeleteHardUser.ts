import { MongoUserModel } from "../infrastructure/mongoModel/MongoUserModel.js";
import { ApolloError } from "apollo-server-errors";

export default async function DeleteHardUser(userId: string) {
  const userToDelete = await MongoUserModel.findById(userId);
  if (!userToDelete) {
    throw new ApolloError("User not found", "USER_NOT_FOUND");
  }
  return await userToDelete.deleteOne();
}
