import { ApolloError } from "apollo-server-errors";
import { MongoPlanModel } from "../infrastructure/mongoModel/MongoPlanModel.js";
import { MongoPermissionModel } from "../../permissions/infrastructure/mongoModel/MongoPermissionModel.js";
import IPlan from "../domain/interfaces/IPlan.js";

export default async function AddPermissionToPlan(
  planId: string,
  permissionsIds: string[]
): Promise<IPlan> {
  const plan = await MongoPlanModel.findById(planId);
  if (!plan) {
    throw new ApolloError("Plan not found", "PLAN_NOT_FOUND");
  }
  const permissions = await MongoPermissionModel.find({
    _id: { $in: permissionsIds },
  });
  plan.permissions.push(...permissions);
  plan.permissions = Array.from(new Set(plan.permissions));
  return plan.save();
}
