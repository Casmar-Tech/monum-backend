import { model, Schema, Types } from "mongoose";
import { IMedia, IMediaTranslated } from "../../domain/interfaces/IMedia.js";
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
      required: true,
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
    audioUrl: {
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
  },
  { timestamps: true }
);

export async function createMediaFromSimpleMedia(
  media: IMediaTranslated,
  language: string
) {
  return await MongoMediaModel.create({
    title: {
      [language]: media.title,
    },
    text: {
      [language]: media.text,
    },
    rating: media.rating,
    audioUrl: {
      [language]: media.audioUrl,
    },
    voiceId: {
      [language]: media.voiceId,
    },
    duration: media.duration,
    placeId: media.placeId,
  });
}

export const MongoMediaModel = model("medias", MediaSchema);
