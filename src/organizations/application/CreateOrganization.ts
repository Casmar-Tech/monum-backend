import { MongoPlanModel } from "../../plans/infrastructure/mongoModel/MongoPlanModel.js";
import { IAddress } from "../domain/interfaces/IAddress.js";
import { IOrganizationTranslated } from "../domain/interfaces/IOrganization.js";
import { MongoOrganizationModel } from "../infrastructure/mongoModel/MongoOrganizationModel.js";
import { getTranslatedOrganization } from "../domain/functions/Organization.js";

export default async function CreateOrganization(
  organization: IOrganizationTranslated,
  planId: string
): Promise<IOrganizationTranslated> {
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
    coordinates: {
      lat: address.coordinates.lat,
      lng: address.coordinates.lng,
    },
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
