import { Types } from "mongoose";
import { FromSupport } from "../types/FromSupportTypes";

export interface IGetPlaceHistory {
  _id?: Types.ObjectId;
  placeId: Types.ObjectId;
  isMobile: boolean;
  userId: Types.ObjectId;
  fromSupport: FromSupport;
  createdAt?: Date;
  updatedAt?: Date;
}
