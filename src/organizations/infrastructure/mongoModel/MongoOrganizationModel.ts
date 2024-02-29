import { Schema, model } from "mongoose";
import { IOrganization } from "../../domain/interfaces/IOrganization.js";
import { IAddress } from "../../domain/interfaces/IAddress.js";
import IContact from "../../domain/interfaces/IContact.js";
import { Languages } from "../../../shared/Types.js";
import { PlanSchema } from "../../../plans/infrastructure/mongoModel/MongoPlanModel.js";

export const Contact = new Schema<IContact>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber: { type: String, required: true },
});

export const Address = new Schema<IAddress>({
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  street: {
    type: Object,
    of: String,
  },
  city: {
    type: Object,
    of: String,
    required: true,
  },
  postalCode: { type: String },
  province: {
    type: Object,
    of: String,
  },
  country: {
    type: Object,
    of: String,
    required: true,
  },
});

export const MongoOrganizationSchema = new Schema<IOrganization>(
  {
    address: {
      type: Address,
      required: true,
    },
    contacts: {
      type: [Contact],
      required: true,
    },
    plan: {
      type: PlanSchema,
      required: true,
    },
    name: { type: String, required: true },
    description: { type: String, required: true },
    availableLanguages: {
      type: [String],
      required: true,
    },
    defaultLanguage: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export const MongoOrganizationModel = model(
  "organization",
  MongoOrganizationSchema
);
