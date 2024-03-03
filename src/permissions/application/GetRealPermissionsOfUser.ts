import { MongoOrganizationModel } from "../../organizations/infrastructure/mongoModel/MongoOrganizationModel.js";
import { MongoRoleModel } from "../../roles/infrastructure/mongoModel/MongoRoleModel.js";
import IPermission from "../domain/interfaces/IPermission.js";
import { MongoUserModel } from "../../users/infrastructure/mongoModel/MongoUserModel.js";
import { ApolloError } from "apollo-server-errors";

export default async function GetRealPermissionsOfUser(
  userId: string,
  entity?: string,
  action?: string
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
  return allPermissions
    .map((permission) => ({
      ...permission,
      id: permission._id?.toString(),
    }))
    .filter((permission) => {
      if (entity && permission.entity !== entity) {
        return false;
      }
      if (action && !permission.action.includes(action)) {
        return false;
      }
      return true;
    });
}
