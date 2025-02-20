import { Types } from "mongoose";

export default interface IReview {
  _id: Types.ObjectId;
  createdById: Types.ObjectId;
  entityId: Types.ObjectId;
  entityType: "route" | "place" | "media";
  rating: number;
  comment?: string;
}
