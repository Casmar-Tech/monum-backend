import { model, Schema } from "mongoose";
import IReview from "../../domain/interfaces/IReview.js";

const ReviewSchema = new Schema<IReview>({
  createdById: { type: Schema.Types.ObjectId, required: true },
  entityId: { type: Schema.Types.ObjectId, required: true },
  entityType: { type: String, required: true },
  rating: { type: Number, required: true },
  comment: { type: String },
});

ReviewSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

ReviewSchema.set("toJSON", { virtuals: true });
ReviewSchema.set("toObject", { virtuals: true });

export const MongoReviewModel = model("reviews", ReviewSchema);
