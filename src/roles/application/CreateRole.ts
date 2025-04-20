import { MongoPermissionModel } from "../../permissions/infrastructure/mongoModel/MongoPermissionModel.js";
import { MongoRoleModel } from "../infrastructure/mongoModel/MongoRoleModel.js";
import IRole from "../domain/interfaces/IRole.js";

export default async function CreateRole(
  role: IRole,
  permissionsIds: string[]
): Promise<IRole> {
  const permissions = await MongoPermissionModel.find({
    _id: { $in: permissionsIds },
  });
  role.permissions = permissions;
  const roleCreated = new MongoRoleModel(role);
  return roleCreated.save();
}
