import { Types } from "mongoose";
import IStop from "./IStop.js";

export default interface IRoute {
  _id?: Types.ObjectId;
  title: string;
  titleTranslations: {
    [key: string]: string;
  };
  description: {
    [key: string]: string;
  };
  rating?: number;
  duration: number;
  optimizedDuration: number;
  distance: number;
  optimizedDistance: number;
  stops: IStop[];
  cityId: Types.ObjectId;
}
