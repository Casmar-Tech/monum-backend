import CreateOrganization from "../../application/CreateOrganization.js";
import {
  IOrganization,
  IOrganizationTranslated,
} from "../../domain/interfaces/IOrganization.js";
import { IAddressTranslated } from "../../domain/interfaces/IAddress.js";
import GetOrganizationById from "../../application/GetOrganizationById.js";
import GetOrganizationFullById from "../../application/GetOrganizationFullById.js";
import { Languages } from "../../../shared/Types.js";
import { checkToken } from "../../../middleware/auth.js";
import { ApolloError } from "apollo-server-errors";

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
  Organization: {
    id: (parent: IOrganization) => parent?._id?.toString(),
  },
  OrganizationFull: {
    id: (parent: IOrganization) => parent?._id?.toString(),
  },
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
  Query: {
    organization: async (
      parent: any,
      args: { id: string; language: Languages },
      { token }: { token: string }
    ) => {
      const { id: userId } = checkToken(token);
      if (!userId) throw new ApolloError("User not found", "USER_NOT_FOUND");
      return GetOrganizationById(userId, args.id, args.language);
    },
    organizationFull: async (
      parent: any,
      args: { id: string },
      { token }: { token: string }
    ) => {
      const { id: userId } = checkToken(token);
      if (!userId) throw new ApolloError("User not found", "USER_NOT_FOUND");
      return GetOrganizationFullById(args.id);
    },
  },
};
export default resolvers;
