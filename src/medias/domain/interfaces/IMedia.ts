import { Types } from "mongoose";
import {
  IPlace,
  IPlaceTranslated,
} from "../../../places/domain/interfaces/IPlace";
export interface IMedia {
  _id?: Types.ObjectId;
  id?: String;
  placeId: Types.ObjectId;
  topicId: Types.ObjectId;
  title: {
    [key: string]: string;
  };
  text: {
    [key: string]: string;
  };
  rating: number;
  audioUrl: {
    [key: string]: string;
  };
  voiceId: {
    [key: string]: string;
  };
  duration: {
    [key: string]: number;
  };
  createdAt: Date;
  updatedAt: Date;
  place?: IPlace;
}

export interface IMediaTranslated
  extends Omit<
    IMedia,
    "title" | "text" | "audioUrl" | "voiceId" | "place" | "duration"
  > {
  title: string;
  text: string;
  audioUrl: string;
  voiceId: string;
  place?: IPlaceTranslated;
  duration?: number;
}
