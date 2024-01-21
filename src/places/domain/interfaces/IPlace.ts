import { Types } from "mongoose";
import IPhoto from "./IPhoto.js";
import { IAddress, IAddressSimplified } from "./IAddress.js";

export interface IPlace {
  _id?: Types.ObjectId;
  name: string;
  nameTranslations: {
    [key: string]: string;
  };
  address: IAddress;
  description: {
    [key: string]: string;
  };
  importance: number;
  photos?: IPhoto[];
  rating?: number;
}

export interface IPlaceSimplified {
  _id?: Types.ObjectId;
  id?: Types.ObjectId;
  name: string;
  address: IAddressSimplified;
  description: string;
  importance: number;
  photos?: IPhoto[];
  rating?: number;
}
