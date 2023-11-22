import { Types } from "mongoose";

export default interface IPhoto {
  _id?: Types.ObjectId;
  pexelsId: string;
  url: string;
  width: number;
  height: number;
}
