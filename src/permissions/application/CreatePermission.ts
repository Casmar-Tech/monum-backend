import { ApolloError } from "apollo-server-errors";
import IPermission from "../domain/interfaces/IPermission.js";
import { MongoPermissionModel } from "../infrastructure/mongoModel/MongoPermissionModel.js";

export default async function CreatePermission(
  permission: IPermission
): Promise<IPermission> {
  const permissionAlreadyExists = await MongoPermissionModel.findOne({
    action: permission.action,
    entity: permission.entity,
  });
  if (permissionAlreadyExists) {
    throw new ApolloError(
      "Permission already exists",
      "PERMISSION_ALREADY_EXISTS"
    );
  }
  const permissionCreated = new MongoPermissionModel(permission);
  return permissionCreated.save();
}
