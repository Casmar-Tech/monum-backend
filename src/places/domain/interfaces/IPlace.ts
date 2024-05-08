import { Types } from "mongoose";
import IPhoto, { IPhotoExisting } from "./IPhoto.js";
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
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  deleted?: boolean;
}

export interface IPlaceTranslated
  extends Omit<IPlace, "address" | "description"> {
  address: IAddressTranslated;
  description?: string;
  imagesUrl?: string[];
  photos?: IPhotoExisting[];
}

export interface IPlacesSearchResults {
  places: IPlaceTranslated[];
  pageInfo: {
    totalPages: number;
    currentPage: number;
    totalResults: number;
  };
}
