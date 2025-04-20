import CreatePlan from "../../application/CreatePlan.js";
import IPlan from "../../domain/interfaces/IPlan.js";
import AddPermissionsToPlan from "../../application/AddPermissionsToPlan.js";
import RemovePermissionsFromPlan from "../../application/RemovePermissionsFromPlan.js";

interface CreatePlanInput {
  createPlanInput: {
    plan: IPlan;
    permissionsIds: string[];
  };
}

const resolvers = {
  Plan: {
    id: (parent: IPlan) => parent?._id?.toString(),
  },
  Mutation: {
    createPlan: async (parent: any, args: CreatePlanInput, context: any) => {
      const { createPlanInput } = args;
      const { plan, permissionsIds } = createPlanInput;
      const createdPlan = await CreatePlan(plan, permissionsIds);
      return createdPlan;
    },
    addPermissionsToPlan: async (
      parent: any,
      args: { planId: string; permissionsIds: string[] },
      context: any
    ) => {
      const { planId, permissionsIds } = args;
      return AddPermissionsToPlan(planId, permissionsIds);
    },
    removePermissionsFromPlan: async (
      parent: any,
      args: { planId: string; permissionsIds: string[] },
      context: any
    ) => {
      const { planId, permissionsIds } = args;
      return RemovePermissionsFromPlan(planId, permissionsIds);
    },
  },
};
export default resolvers;
