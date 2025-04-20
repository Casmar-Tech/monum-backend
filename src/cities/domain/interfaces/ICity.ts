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
  province: {
    es_ES: string;
    en_US: string;
    ca_ES: string;
    fr_FR: string;
  };
  county: {
    es_ES: string;
    en_US: string;
    ca_ES: string;
    fr_FR: string;
  };
  country: {
    es_ES: string;
    en_US: string;
    ca_ES: string;
    fr_FR: string;
  };
  coordinates: {
    type: "Point";
    coordinates: [number, number];
  };
  population?: number;
  hasRoutes?: boolean;
  hasPlaces?: boolean;
  photo?: IPhoto;
}

export interface ICityTranslated
  extends Omit<ICity, "name" | "province" | "county" | "country"> {
  id: string;
  name: string;
  province: string;
  county: string;
  country: string;
}

export interface ICityWithDistance extends ICityTranslated {
  distance: number;
}
