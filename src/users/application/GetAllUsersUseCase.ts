import { MongoUserModel } from "../infrastructure/mongoModel/MongoUserModel.js";
import IUser from "../domain/IUser.js";

export default async function GetAllUsersUseCase(): Promise<IUser[]> {
  const users = await MongoUserModel.find();
  return users;
}
