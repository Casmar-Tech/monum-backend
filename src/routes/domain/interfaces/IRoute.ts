import { Types } from "mongoose";
import { IStop, IStopTranslated } from "./IStop.js";

export interface IRoute {
  _id?: Types.ObjectId;
  id?: string;
  title: {
    [key: string]: string;
  };
  description: {
    [key: string]: string;
  };
  rating?: number;
  stops: IStop[];
  duration?: number;
  optimizedDuration?: number;
  distance?: number;
  optimizedDistance?: number;
  cityId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRouteTranslated
  extends Omit<IRoute, "title" | "description" | "stops"> {
  title: string;
  description: string;
  stops: IStopTranslated[];
}
