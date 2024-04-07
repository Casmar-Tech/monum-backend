import { Schema, model } from "mongoose";
import { IOrganization } from "../../domain/interfaces/IOrganization.js";
import { IAddress } from "../../domain/interfaces/IAddress.js";
import IContact from "../../domain/interfaces/IContact.js";
import { PlanSchema } from "../../../plans/infrastructure/mongoModel/MongoPlanModel.js";

export const Contact = new Schema<IContact>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber: { type: String, required: true },
});

export const Address = new Schema<IAddress>({
  coordinates: {
    type: { type: String, enum: ["Point"], required: true },
    coordinates: {
      type: [Number],
      required: true,
    },
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

export const OrganizationSchema = new Schema<IOrganization>(
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
    citiesIds: {
      type: [Schema.Types.ObjectId],
      required: true,
    },
    defaultLanguage: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

OrganizationSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

OrganizationSchema.set("toJSON", { virtuals: true });
OrganizationSchema.set("toObject", { virtuals: true });
OrganizationSchema.index({ "address.coordinates": "2dsphere" });

export const MongoOrganizationModel = model("organization", OrganizationSchema);
