import { MongoMediaModel } from "../infrastructure/mongoModel/MongoMediaModel.js";
import { IMediaTranslated } from "../domain/interfaces/IMedia.js";
import GetUserByIdUseCase from "../../users/application/GetUserByIdUseCase.js";
import { getTranslatedMedia } from "../domain/functions/Media.js";
import { Languages } from "../../shared/Types.js";

export default async function GetMediasByPlaceIdUseCase(
  userId: string,
  placeId: string,
  language?: Languages,
  textSearch?: string
): Promise<IMediaTranslated[]> {
  let userLanguage = language;
  if (!userLanguage) {
    const user = await GetUserByIdUseCase(userId);
    userLanguage = user.language;
  }
  const query = { deleted: { $ne: true } };
  if (placeId) {
    Object.assign(query, { placeId });
  }
  if (textSearch) {
    Object.assign(query, { $text: { $search: textSearch } });
  }
  if (userLanguage) {
    Object.assign(query, { [`title.${userLanguage}`]: { $exists: true } });
    Object.assign(query, { [`text.${userLanguage}`]: { $exists: true } });
  }
  const medias = await MongoMediaModel.find(query);
  const translatedMedias = await Promise.all(
    medias.map(
      async (media) =>
        await getTranslatedMedia(media.toObject(), userLanguage || "en_US")
    )
  );
  return translatedMedias;
}
