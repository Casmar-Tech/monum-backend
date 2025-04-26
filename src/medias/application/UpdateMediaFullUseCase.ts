import { Languages } from "../../shared/Types.js";
import GetUserByIdUseCase from "../../users/application/GetUserByIdUseCase.js";
import { IMedia } from "../domain/interfaces/IMedia.js";
import { UpdateMediaFullInput } from "../infrastructure/graphql/resolvers.js";
import { MongoMediaModel } from "../infrastructure/mongoModel/MongoMediaModel.js";
import { Types } from "mongoose";
import VideoBase64ToUrl from "./VideoBase64ToUrl.js";
import AudioTextToUrl from "./AudioTextToUrl.js";
import GetAudioDuration from "./GetAudioDuration.js";

export default async function UpdateMediaFullUseCase(
  userId: string,
  mediaId: string,
  media: UpdateMediaFullInput
): Promise<IMedia> {
  const arrayToObjectLanguage = (array: any[]) =>
    array.reduce((obj, item) => {
      obj[item.key as Languages] = item.value;
      return obj;
    }, {} as { [key in Languages]: string });
  const user = await GetUserByIdUseCase(userId);
  if (!user) {
    throw new Error("User not found");
  }
  const mediaToUpdate = await MongoMediaModel.findById(mediaId);
  if (!mediaToUpdate) {
    throw new Error("Media not found");
  }
  if (media.title) {
    mediaToUpdate.title = arrayToObjectLanguage(media.title);
  }
  if (media.type) {
    mediaToUpdate.type = media.type;
  }
  if (media.placeId) {
    mediaToUpdate.placeId = new Types.ObjectId(media.placeId);
  }
  const languages =
    media.title && media.title.map((title) => title.key as Languages);

  switch (media.type) {
    case "text":
      mediaToUpdate.text = media.text ? arrayToObjectLanguage(media.text) : {};
      break;
    case "video":
      await Promise.all(
        languages.map(async (language) => {
          try {
            if (
              media.videosToDelete &&
              media.videosToDelete.includes(language)
            ) {
              mediaToUpdate.url && delete mediaToUpdate.url[language];
              mediaToUpdate.duration && delete mediaToUpdate.duration[language];
              return;
            }
            if (!media.videoBase64 || !media.videoDurationInSeconds) {
              return;
            }
            const video = media.videoBase64.find(
              (v) => v.key === language
            )?.value;
            const videoDuration = media.videoDurationInSeconds.find(
              (v) => v.key === language
            )?.value;
            if (!video || !videoDuration) {
              return;
            }
            const videoUrl = await VideoBase64ToUrl(
              media.placeId,
              mediaId,
              language,
              video
            );
            mediaToUpdate.url = {
              ...mediaToUpdate.url,
              [language]: videoUrl,
            };
            mediaToUpdate.duration = {
              ...mediaToUpdate.duration,
              [language]: videoDuration,
            };
          } catch (error) {
            console.log("Error", error);
            return;
          }
        })
      );
      break;
    case "audio":
      if (!media.text || !media.title) {
        throw new Error("Audio not found");
      }
      await Promise.all(
        languages.map(async (language) => {
          try {
            const textLanguage = media.text.find(
              (v) => v.key === language
            )?.value;
            const oldTextLanguage = mediaToUpdate?.text?.[language];
            const oldType = mediaToUpdate?.type;
            if (
              !textLanguage ||
              (textLanguage === oldTextLanguage && oldType === "audio")
            ) {
              return;
            }
            const audioUrl = await AudioTextToUrl(
              media.placeId,
              mediaToUpdate.id,
              language,
              textLanguage
            );
            const duration = await GetAudioDuration(audioUrl);
            if (!duration) {
              return;
            }
            mediaToUpdate.text = arrayToObjectLanguage(media.text);
            mediaToUpdate.url = {
              ...mediaToUpdate.url,
              [language]: audioUrl,
            };
            mediaToUpdate.duration = {
              ...mediaToUpdate.duration,
              [language]: duration || 0,
            };
          } catch (error) {
            console.log("Error", error);
            return;
          }
        })
      );
      break;
    default:
      throw new Error("Media type not valid");
  }
  return mediaToUpdate.save();
}
