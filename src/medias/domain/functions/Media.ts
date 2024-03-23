import { getTranslatedPlace } from "../../../places/domain/functions/Place.js";
import { IMedia, IMediaTranslated } from "../interfaces/IMedia.js";

const getTranslation = (
  translations: { [key: string]: string },
  language: string
): string => {
  return translations[language] || Object.values(translations)[0] || "";
};

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
