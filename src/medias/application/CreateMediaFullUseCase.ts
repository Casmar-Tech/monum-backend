import { Languages } from "../../shared/Types.js";
import GetUserByIdUseCase from "../../users/application/GetUserByIdUseCase.js";
import { IMedia } from "../domain/interfaces/IMedia.js";
import { UpdateMediaFullInput } from "../infrastructure/graphql/resolvers.js";
import { MongoMediaModel } from "../infrastructure/mongoModel/MongoMediaModel.js";
import VideoBase64ToUrl from "./VideoBase64ToUrl.js";
import AudioTextToUrl from "./AudioTextToUrl.js";
import GetAudioDuration from "./GetAudioDuration.js";

export default async function CreateMediaFullUseCase(
  userId: string,
  media: UpdateMediaFullInput
): Promise<IMedia> {
  const user = await GetUserByIdUseCase(userId);
  if (!user) {
    throw new Error("User not found");
  }
  const arrayToObjectLanguage = (array: any[]) =>
    array.reduce((obj, item) => {
      obj[item.key as Languages] = item.value;
      return obj;
    }, {} as { [key in Languages]: string });
  let newMediaModel = new MongoMediaModel({
    title: arrayToObjectLanguage(media.title),
    type: media.type,
    createdBy: userId,
    placeId: media.placeId,
  });
  const languages = media.title.map((title) => title.key as Languages);
  switch (media.type) {
    case "text":
      newMediaModel.text = arrayToObjectLanguage(media.text);
      break;
    case "video":
      await Promise.all(
        languages.map(async (language) => {
          try {
            if (!media.videoBase64 || !media.videoDurationInSeconds) {
              throw new Error("Video not found");
            }
            const videoLanguage = media.videoBase64.find(
              (v) => v.key === language
            )?.value;
            const videoDuration = media.videoDurationInSeconds.find(
              (v) => v.key === language
            )?.value;
            if (!videoLanguage || !videoDuration) {
              return;
            }
            const videoUrl = await VideoBase64ToUrl(
              media.placeId,
              newMediaModel.id,
              language,
              videoLanguage
            );
            newMediaModel.url = {
              ...newMediaModel.url,
              [language]: videoUrl,
            };
            newMediaModel.duration = {
              ...newMediaModel.duration,
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
            if (!textLanguage) {
              return;
            }
            const audioUrl = await AudioTextToUrl(
              media.placeId,
              newMediaModel.id,
              language,
              textLanguage
            );
            const duration = await GetAudioDuration(audioUrl);
            if (!duration) {
              return;
            }
            newMediaModel.text = arrayToObjectLanguage(media.text);
            newMediaModel.url = {
              ...newMediaModel.url,
              [language]: audioUrl,
            };
            newMediaModel.duration = {
              ...newMediaModel.duration,
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
  return newMediaModel.save();
}
