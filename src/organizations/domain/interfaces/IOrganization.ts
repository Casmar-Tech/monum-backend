import { Types } from "mongoose";
import { IAddress, IAddressTranslated } from "./IAddress.js";
import IContact from "./IContact.js";
import IPlan from "../../../plans/domain/interfaces/IPlan.js";
import { Languages } from "../../../shared/Types.js";

export interface IOrganization {
  _id?: Types.ObjectId;
  id: string;
  address: IAddress;
  contacts: IContact[];
  availableLanguages: Languages[];
  defaultLanguage: Languages;
  plan: IPlan;
  name: string;
  description: string;
  citiesIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrganizationTranslated
  extends Omit<IOrganization, "address"> {
  address: IAddressTranslated;
}
