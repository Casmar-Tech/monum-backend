import IPermission from "../domain/interfaces/IPermission.js";
import { MongoPermissionModel } from "../infrastructure/mongoModel/MongoPermissionModel.js";

export default async function CreatePermission(
  permission: IPermission
): Promise<IPermission> {
  const permissionCreated = new MongoPermissionModel(permission);
  return permissionCreated.save();
}
