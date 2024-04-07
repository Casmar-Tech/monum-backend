import CreateOrganization from "../../application/CreateOrganization.js";
import { IOrganizationTranslated } from "../../domain/interfaces/IOrganization.js";
import { IAddressTranslated } from "../../domain/interfaces/IAddress.js";

interface IAddressInput extends Omit<IAddressTranslated, "coordinates"> {
  coordinates: {
    lat: number;
    lng: number;
  };
}

interface IOrganizationInput extends Omit<IOrganizationTranslated, "address"> {
  address: IAddressInput;
}

interface CreateOrganizationInput {
  createOrganizationInput: {
    organization: IOrganizationInput;
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
      const createdOrganization = await CreateOrganization({
        organization: {
          ...organization,
          address: {
            ...organization.address,
            coordinates: {
              type: "Point",
              coordinates: [
                organization.address.coordinates.lng,
                organization.address.coordinates.lat,
              ],
            },
          },
        },
        planId,
      });
      return createdOrganization;
    },
  },
};
export default resolvers;
