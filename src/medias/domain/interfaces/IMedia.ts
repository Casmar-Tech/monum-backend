import { Types } from "mongoose";
import {
  IPlace,
  IPlaceTranslated,
} from "../../../places/domain/interfaces/IPlace.js";
import { MediaType } from "../types/MediaType.js";
export interface IMedia {
  _id?: Types.ObjectId;
  id?: String;
  placeId: Types.ObjectId;
  title: {
    [key: string]: string;
  };
  text?: {
    [key: string]: string;
  };
  rating: number;
  url?: {
    [key: string]: string;
  };
  voiceId?: {
    [key: string]: string;
  };
  duration: {
    [key: string]: number;
  };
  createdAt: Date;
  updatedAt: Date;
  place?: IPlace;
  type: MediaType;
  format?: {
    [key: string]: string;
  };
  deleted?: boolean;
}

export interface IMediaTranslated
  extends Omit<
    IMedia,
    "title" | "text" | "url" | "voiceId" | "place" | "duration" | "format"
  > {
  title: string;
  text?: string;
  url?: string;
  voiceId?: string;
  place?: IPlaceTranslated;
  duration?: number;
  format?: string;
  deleted?: boolean;
}
