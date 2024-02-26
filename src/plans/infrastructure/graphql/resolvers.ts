import CreatePlan from "../../application/CreatePlan.js";
import IPlan from "../../domain/interfaces/IPlan.js";

interface CreatePlanInput {
  createPlanInput: {
    plan: IPlan;
    permissionsIds: string[];
  };
}

const resolvers = {
  Mutation: {
    createPlan: async (parent: any, args: CreatePlanInput, context: any) => {
      const { createPlanInput } = args;
      const { plan, permissionsIds } = createPlanInput;
      const createdPlan = await CreatePlan(plan, permissionsIds);
      return createdPlan;
    },
  },
};
export default resolvers;
