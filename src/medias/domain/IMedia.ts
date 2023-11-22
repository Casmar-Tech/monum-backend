import { Types } from "mongoose";
import IPlace from "../../places/domain/interfaces/IPlace.js";

export default interface IMedia {
  _id?: Types.ObjectId;
  place: IPlace;
  title: string;
  text: string;
  language: string;
  rating: number;
  audioUrl: string;
  voiceId: string;
  duration: number;
}
