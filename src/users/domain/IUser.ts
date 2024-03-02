import { Types } from "mongoose";
import { Languages } from "../../shared/Types.js";

export default interface IUser {
  _id?: Types.ObjectId;
  id?: string;
  email: string;
  username: string;
  roleId: Types.ObjectId;
  organizationId?: Types.ObjectId;
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
}
