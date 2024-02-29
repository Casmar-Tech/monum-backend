import { MongoOrganizationModel } from "../../organizations/infrastructure/mongoModel/MongoOrganizationModel";
import { MongoRoleModel } from "../../roles/infrastructure/mongoModel/MongoRoleModel";
import IPermission from "../domain/interfaces/IPermission";
import { MongoUserModel } from "../../users/infrastructure/mongoModel/MongoUserModel.js";
import { ApolloError } from "apollo-server-errors";

export default async function GetRealPermissionsFromUser(
  userId: string
): Promise<IPermission[]> {
  const user = await MongoUserModel.findById(userId);
  if (!user) {
    throw new ApolloError("User not found", "USER_NOT_FOUND");
  }
  const { organizationId, roleId } = user;
  const allPermissions = [];
  if (organizationId) {
    const organization = await MongoOrganizationModel.findById(
      organizationId
    ).lean();
    if (organization) {
      const permissions = organization.plan.permissions;
      allPermissions.push(...permissions);
    }
  }
  if (roleId) {
    const role = await MongoRoleModel.findById(roleId).lean();
    if (role) {
      const permissions = role.permissions;
      allPermissions.push(...permissions);
    }
  }
  // TODO: Implement the logic to get the permissions from the user
  return allPermissions;
}
