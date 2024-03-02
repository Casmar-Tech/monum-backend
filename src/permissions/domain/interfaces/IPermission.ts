import { Types } from "mongoose";

export default interface IPermission {
  _id?: Types.ObjectId;
  id?: string;
  name: string;
  description: string;
  action: string;
  entity: string;
  max?: number;
  min?: number;
  createdAt: Date;
  updatedAt: Date;
}
