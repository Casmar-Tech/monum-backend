import { Types } from "mongoose";

export default interface IPhoto {
  _id?: Types.ObjectId;
  id?: string;
  url: string;
  sizes: {
    [key: string]: string;
  };
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy: Types.ObjectId;
  order?: number;
  deleteBy?: Types.ObjectId;
  name?: string;
}

export interface IPhotoExisting extends Omit<IPhoto, "order"> {
  order: number;
}
