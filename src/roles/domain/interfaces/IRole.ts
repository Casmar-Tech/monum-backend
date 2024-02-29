import { Types } from "mongoose";
import IPermission from "../../../permissions/domain/interfaces/IPermission.js";

export default interface IRole {
  _id?: Types.ObjectId;
  id: string;
  name: string;
  description: string;
  permissions: IPermission[];
  createdAt: Date;
  updatedAt: Date;
}
