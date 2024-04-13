import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getTranslatedPlace } from "../../../places/domain/functions/Place.js";
import { Languages } from "../../../shared/Types.js";
import { IMedia, IMediaTranslated } from "../interfaces/IMedia.js";
import { Readable } from "stream";
import mm from "music-metadata";
import { MongoMediaModel } from "../../infrastructure/mongoModel/MongoMediaModel.js";

const getTranslation = (
  translations: { [key: string]: string },
  language: string
): string => {
  return translations[language] || Object.values(translations)[0] || "";
};

export async function getMediaDuration(mediaId: string, language: Languages) {
  const media = await MongoMediaModel.findById(mediaId);
  if (!media) return 0;
  const audioUrl = media.url?.[language];
  if (!audioUrl) return 0;
  const client = new S3Client({
    region: "eu-west-1",
  });

  const { Body } = await client.send(
    new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_AUDIOS!,
      Key: audioUrl,
    })
  );
  if (!Body) return 0;
  const chunks: any[] = [];

  if (Body instanceof Readable) {
    for await (const chunk of Body) {
      chunks.push(chunk);
    }
  }
  const buffer = Buffer.concat(chunks);
  const metadata = await mm.parseBuffer(buffer, {
    mimeType: "audio/mpeg",
    size: buffer.length,
  });

  return metadata.format.duration;
}

export async function getTranslatedMedia(
  media: IMedia,
  language: string
): Promise<IMediaTranslated> {
  return {
    ...media,
    id: media?._id?.toString(),
    title: getTranslation(media.title, language),
    text: media.text && getTranslation(media.text, language),
    url: media.url && getTranslation(media.url, language),
    voiceId: media.voiceId && getTranslation(media.voiceId, language),
    place: media.place && (await getTranslatedPlace(media.place, language)),
    duration: media.duration?.[language],
    format: media.format && getTranslation(media.format, language),
  };
}
