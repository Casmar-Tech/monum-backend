import { ApolloError } from "apollo-server-errors";
import { MongoPlanModel } from "../infrastructure/mongoModel/MongoPlanModel.js";
import IPlan from "../domain/interfaces/IPlan.js";

export default async function RemovePermissionFromPlan(
  planId: string,
  permissionsIds: string[]
): Promise<IPlan> {
  const plan = await MongoPlanModel.findById(planId);
  if (!plan) {
    throw new ApolloError("Plan not found", "PLAN_NOT_FOUND");
  }
  plan.permissions = plan.permissions.filter(
    (permission) =>
      permission._id && !permissionsIds.includes(permission._id.toString())
  );
  return plan.save();
}
