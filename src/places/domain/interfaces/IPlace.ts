import { Types } from "mongoose";
import IPhoto from "./IPhoto.js";
import IAddress from "./IAddress.js";

export default interface IPlace {
  _id?: Types.ObjectId;
  name: string;
  address: IAddress;
  description: string;
  importance: number;
  photos?: IPhoto[];
  rating?: number;
}
