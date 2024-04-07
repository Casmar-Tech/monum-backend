import { MongoPlanModel } from "../../plans/infrastructure/mongoModel/MongoPlanModel.js";
import { IAddress } from "../domain/interfaces/IAddress.js";
import { IOrganizationTranslated } from "../domain/interfaces/IOrganization.js";
import { MongoOrganizationModel } from "../infrastructure/mongoModel/MongoOrganizationModel.js";
import { getTranslatedOrganization } from "../domain/functions/Organization.js";

interface CreateOrganizationInput {
  organization: IOrganizationTranslated;
  planId: string;
}

export default async function CreateOrganization({
  organization,
  planId,
}: CreateOrganizationInput): Promise<IOrganizationTranslated> {
  const plan = await MongoPlanModel.findOne({ _id: planId });
  if (!plan) {
    throw new Error("Plan not found");
  }
  organization.plan = {
    ...plan.toObject(),
    id: plan._id?.toString() || "",
  };
  const address = organization.address;
  const addressComplete: IAddress = {
    coordinates: address.coordinates,
    street: {
      en_US: address.street || "",
    },
    city: {
      en_US: address.city,
    },
    postalCode: address.postalCode,
    province: {
      en_US: address.province || "",
    },
    county: {
      en_US: address.county || "",
    },
    country: {
      en_US: address.country,
    },
  };
  const organizationCreated = await MongoOrganizationModel.create({
    ...organization,
    address: addressComplete,
  });
  return getTranslatedOrganization(organizationCreated.toObject(), "en_US");
}
