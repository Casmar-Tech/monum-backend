import { model, Schema } from "mongoose";
import { IMedia, IMediaTranslated } from "../../domain/interfaces/IMedia.js";
import { MediaTypeValues } from "../../domain/types/MediaType.js";
export const MediaSchema = new Schema<IMedia>(
  {
    placeId: {
      type: Schema.Types.ObjectId,
      ref: "places",
      required: true,
    },
    topicId: {
      type: Schema.Types.ObjectId,
      ref: "media-topics",
      required: false,
    },
    title: {
      type: Object,
      of: String,
      required: true,
    },
    text: {
      type: Object,
      of: String,
      required: true,
    },
    rating: { type: Number, required: true },
    url: {
      type: Object,
      of: String,
      required: true,
    },
    voiceId: {
      type: Object,
      of: String,
      required: true,
    },
    duration: {
      type: Object,
      of: Number,
    },
    type: {
      type: String,
      required: true,
    },
    format: {
      type: String,
    },
    deleted: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  { timestamps: true }
);

MediaSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

MediaSchema.set("toJSON", { virtuals: true });
MediaSchema.set("toObject", { virtuals: true });

export const MongoMediaModel = model("medias", MediaSchema);
