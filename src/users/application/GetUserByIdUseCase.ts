import { GraphQLError } from "graphql";
import { MongoUserModel } from "../infrastructure/mongoModel/MongoUserModel.js";
import GetRealPermissionsOfUser from "../../permissions/application/GetRealPermissionsOfUser.js";
import IUserWithPermissions from "../domain/IUserWithPermissions.js";

export default async function GetUserByIdUseCase(
  id: string
): Promise<IUserWithPermissions> {
  const user = (await MongoUserModel.findById(
    id
  ).lean()) as IUserWithPermissions;
  if (!user || !user._id) {
    throw new GraphQLError("User not found", {
      extensions: {
        code: "USER_NOT_FOUND",
        http: { status: 404 },
      },
    });
  }
  user.id = user._id.toString();
  const realPermissions = await GetRealPermissionsOfUser(user.id);
  user.permissions = realPermissions;
  return user;
}
