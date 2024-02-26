import CreateOrganization from "../../application/CreateOrganization.js";
import { IOrganizationTranslated } from "../../domain/interfaces/IOrganization.js";

interface CreateOrganizationInput {
  createOrganizationInput: {
    organization: IOrganizationTranslated;
    planId: string;
  };
}

const resolvers = {
  Mutation: {
    createOrganization: async (
      parent: any,
      args: CreateOrganizationInput,
      context: any
    ) => {
      const { createOrganizationInput } = args;
      const { planId, organization } = createOrganizationInput;
      const createdOrganization = await CreateOrganization(
        organization,
        planId
      );
      return createdOrganization;
    },
  },
};
export default resolvers;
