import { Model, model, Schema, Types } from "mongoose";
import { IMedia, IMediaSimplified } from "../../domain/IMedia.js";
import { PlaceSchema } from "../../../places/infrastructure/mongoModel/MongoPlaceModel.js";

interface IMediaMethods {
  getSimplifiedVersion: (language: string) => IMediaSimplified;
}

type MediaModel = Model<IMedia, {}, IMediaMethods>;

export const MediaSchema = new Schema<IMedia, MediaModel, IMediaMethods>({
  place: { type: PlaceSchema, required: true },
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
  duration: { type: Number },
});

MediaSchema.method(
  "getSimplifiedVersion",
  function (language: string): IMediaSimplified {
    const getTranslation = (translations: { [key: string]: string }) =>
      translations[language] || "";

    return {
      id: this.id,
      title: getTranslation(this.title),
      text: getTranslation(this.text),
      rating: this.rating,
      audioUrl: getTranslation(this.audioUrl),
      voiceId: getTranslation(this.voiceId),
      duration: this.duration,
    };
  }
);

export async function createMediaFromSimpleMedia(
  media: IMediaSimplified,
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
  });
}

export const MongoMediaModel = model("medias-news", MediaSchema);
