import { model, Schema } from "mongoose";
import { IMediaTopic } from "../../domain/interfaces/IMediaTopic.js";

export const MediaTopicSchema = new Schema<IMediaTopic>({
  topic: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

MediaTopicSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

MediaTopicSchema.set("toJSON", { virtuals: true });
MediaTopicSchema.set("toObject", { virtuals: true });

export const MongoMediaTopicModel = model("media-topics", MediaTopicSchema);
