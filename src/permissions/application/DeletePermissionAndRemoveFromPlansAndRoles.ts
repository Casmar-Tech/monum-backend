import { MongoPlanModel } from "../../plans/infrastructure/mongoModel/MongoPlanModel.js";
import { MongoRoleModel } from "../../roles/infrastructure/mongoModel/MongoRoleModel.js";
import { MongoPermissionModel } from "../infrastructure/mongoModel/MongoPermissionModel.js";

export default async function DeletePermissionAndRemoveFromPlansAndRoles(
  permissionId: string
): Promise<void> {
  await MongoPermissionModel.findByIdAndDelete(permissionId);
  const plans = await MongoPlanModel.find({ "permissions._id": permissionId });
  plans.forEach(async (plan) => {
    plan.permissions = plan.permissions.filter(
      (p) => p._id?.toString() !== permissionId
    );
    await plan.save();
  });
  const roles = await MongoRoleModel.find({ "permissions._id": permissionId });
  roles.forEach(async (role) => {
    role.permissions = role.permissions.filter(
      (p) => p._id?.toString() !== permissionId
    );
    await role.save();
  });
}
