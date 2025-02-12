import { Types } from "mongoose";
import { Languages } from "../../shared/Types.js";
import { IOrganizationTranslated } from "../../organizations/domain/interfaces/IOrganization.js";

export default interface IUser {
  _id?: Types.ObjectId;
  id?: string;
  email?: string;
  username?: string;
  roleId: Types.ObjectId;
  organizationId?: Types.ObjectId;
  organization?: IOrganizationTranslated;
  createdAt?: Date;
  name?: string;
  photo?: string;
  hashedPassword?: string;
  googleId?: string;
  token?: string;
  language: Languages;
  recoveryPasswordHashedCode?: string;
  lastRecoveryPasswordEmailSent?: Date;
  lastRecoveryPasswordEmailResent?: Date;
  recoveryPasswordCodeValidity?: Date;
  deviceId?: string;
  thirdPartyAccount?: "google" | "apple";
  thirdPartyEmail?: string;
  websiteUrl?: string;
}
