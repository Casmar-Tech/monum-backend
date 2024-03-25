import { GraphQLError } from "graphql";
import { MongoUserModel } from "../infrastructure/mongoModel/MongoUserModel.js";
import GetRealPermissionsOfUser from "../../permissions/application/GetRealPermissionsOfUser.js";
import IUserWithPermissions from "../domain/IUserWithPermissions.js";

export default async function GetAllUsersUseCase(): Promise<
  IUserWithPermissions[]
> {
  const users = (await MongoUserModel.find().lean()) as [IUserWithPermissions];
  const usersWithPermissions = await Promise.all(
    users.map(async (user) => {
      if (!user || !user._id) {
        throw new GraphQLError("User not found", {
          extensions: {
            code: "USER_NOT_FOUND",
            http: { status: 404 },
          },
        });
      }
      const realPermissions = await GetRealPermissionsOfUser(
        user._id.toString()
      );
      user.permissions = realPermissions;
      return user;
    })
  );
  return usersWithPermissions;
}
