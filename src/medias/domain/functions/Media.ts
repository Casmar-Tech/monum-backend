import { getTranslatedPlace } from "../../../places/domain/functions/Place";
import { IMedia, IMediaTranslated } from "../interfaces/IMedia";

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
    text: getTranslation(media.text, language),
    audioUrl: getTranslation(media.audioUrl, language),
    voiceId: getTranslation(media.voiceId, language),
    place: media.place && (await getTranslatedPlace(media.place, language)),
    duration: media.duration?.[language],
  };
}
