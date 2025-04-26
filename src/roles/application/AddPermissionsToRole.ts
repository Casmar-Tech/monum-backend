import { ApolloError } from "apollo-server-errors";
import { MongoRoleModel } from "../infrastructure/mongoModel/MongoRoleModel.js";
import { MongoPermissionModel } from "../../permissions/infrastructure/mongoModel/MongoPermissionModel.js";
import IRole from "../domain/interfaces/IRole.js";

export default async function AddPermissionToRole(
  roleId: string,
  permissionsIds: string[]
): Promise<IRole> {
  const role = await MongoRoleModel.findById(roleId);
  if (!role) {
    throw new ApolloError("Role not found", "PLAN_NOT_FOUND");
  }
  const permissions = await MongoPermissionModel.find({
    _id: { $in: permissionsIds },
  });
  role.permissions.push(...permissions);
  role.permissions = Array.from(new Set(role.permissions));
  return role.save();
}
