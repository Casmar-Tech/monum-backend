import { Types } from "mongoose";
import IPermission from "../../../permissions/domain/interfaces/IPermission.js";

export default interface IPlan {
  _id?: Types.ObjectId;
  id: string;
  name: string;
  description: string;
  price: number;
  permissions: IPermission[];
  createdAt: Date;
  updatedAt: Date;
}
