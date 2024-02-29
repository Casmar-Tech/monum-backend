import { ApolloError } from "apollo-server-errors";
import { MongoRoleModel } from "../infrastructure/mongoModel/MongoRoleModel.js";
import IRole from "../domain/interfaces/IRole.js";

export default async function RemovePermissionFromRole(
  roleId: string,
  permissionsIds: string[]
): Promise<IRole> {
  const role = await MongoRoleModel.findById(roleId);
  if (!role) {
    throw new ApolloError("Role not found", "PLAN_NOT_FOUND");
  }
  role.permissions = role.permissions.filter(
    (permission) =>
      permission._id && !permissionsIds.includes(permission._id.toString())
  );
  return role.save();
}
