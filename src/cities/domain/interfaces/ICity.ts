import { Types } from "mongoose";
import IPhoto from "./IPhoto.js";

export default interface ICity {
  _id: Types.ObjectId;
  translations: {
    en_US: string;
    es_ES?: string;
    ca_ES?: string;
    fr_FR?: string;
  };
  photo: IPhoto;
}
