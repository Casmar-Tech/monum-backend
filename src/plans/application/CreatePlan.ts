import { MongoPermissionModel } from "../../permissions/infrastructure/mongoModel/MongoPermissionModel.js";
import IPlan from "../domain/interfaces/IPlan.js";
import { MongoPlanModel } from "../infrastructure/mongoModel/MongoPlanModel.js";

export default async function CreatePlan(
  plan: IPlan,
  permissionsIds: string[]
): Promise<IPlan> {
  const permissions = await MongoPermissionModel.find({
    _id: { $in: permissionsIds },
  });
  plan.permissions = permissions;
  const planCreated = new MongoPlanModel(plan);
  return planCreated.save();
}
