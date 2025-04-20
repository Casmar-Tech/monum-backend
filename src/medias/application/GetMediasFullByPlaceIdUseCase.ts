import { MongoMediaModel } from "../infrastructure/mongoModel/MongoMediaModel.js";
import { IMedia, IMediaTranslated } from "../domain/interfaces/IMedia.js";

export default async function GetMediasFullByPlaceIdUseCase(
  placeId: string,
  textSearch?: string
): Promise<IMedia[]> {
  const query = { deleted: { $ne: true } };
  if (placeId) {
    Object.assign(query, { placeId });
  }
  if (textSearch) {
    Object.assign(query, { $text: { $search: textSearch } });
  }
  const medias = await MongoMediaModel.find(query);
  return medias;
}
