import { Types } from "mongoose";
import IPhoto from "./IPhoto.js";
import { IAddress, IAddressTranslated } from "./IAddress.js";

export interface IPlace {
  _id?: Types.ObjectId;
  id: string;
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
  mainPhoto?: IPhoto;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  deleted?: boolean;
}

export interface IPlaceTranslated
  extends Omit<IPlace, "address" | "description" | "photos" | "mainPhoto"> {
  address: IAddressTranslated;
  description?: string;
  photos?: string[];
  mainPhoto?: string;
}

export interface IPlacesSearchResults {
  places: IPlaceTranslated[];
  pageInfo: {
    totalPages: number;
    currentPage: number;
    totalResults: number;
  };
}
