import { Types } from "mongoose";
import IPhoto from "../interfaces/IPhoto.js";
export default class Photo implements IPhoto {
  _id: Types.ObjectId;
  pexelsId: string;
  url: string;
  width: number;
  height: number;

  constructor(photo: IPhoto) {
    this._id = new Types.ObjectId();
    this.pexelsId = photo.pexelsId;
    this.url = photo.url;
    this.width = photo.width;
    this.height = photo.height;
  }
}
