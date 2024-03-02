import { Types } from "mongoose";
import IPhoto from "./IPhoto.js";

export interface ICity {
  _id: Types.ObjectId;
  name: {
    en_US: string;
    es_ES?: string;
    ca_ES?: string;
    fr_FR?: string;
  };
  photo: IPhoto;
}

export interface ICityTranslated extends Omit<ICity, "name"> {
  name: string;
}
