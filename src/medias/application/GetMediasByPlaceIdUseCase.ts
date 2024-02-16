import { MongoMediaModel } from "../infrastructure/mongoModel/MongoMediaModel.js";
import { IMediaTranslated } from "../domain/interfaces/IMedia.js";
import GetUserByIdUseCase from "../../users/application/GetUserByIdUseCase.js";
import { getTranslatedMedia } from "../domain/functions/Media.js";

export default async function GetMediasByPlaceIdUseCase(
  userId: string,
  placeId: string
): Promise<IMediaTranslated[]> {
  const user = await GetUserByIdUseCase(userId);
  const query = { deleted: { $ne: true } };
  if (placeId) {
    Object.assign(query, { placeId });
  }
  const medias = await MongoMediaModel.find(query);
  const translatedMedias = await Promise.all(
    medias.map(
      async (media) => await getTranslatedMedia(media.toObject(), user.language)
    )
  );
  return translatedMedias;
}
