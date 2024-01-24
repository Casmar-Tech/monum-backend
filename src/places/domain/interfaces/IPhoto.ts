import { Types } from "mongoose";

export default interface IPhoto {
  _id?: Types.ObjectId;
  url: string;
  name: string;
  width: number;
  height: number;
}
