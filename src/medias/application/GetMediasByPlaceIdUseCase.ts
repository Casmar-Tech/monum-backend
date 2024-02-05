import { MongoMediaModel } from "../infrastructure/mongoModel/MongoMediaModel.js";
import { IMediaTranslated } from "../domain/IMedia.js";
import GetUserByIdUseCase from "../../users/application/GetUserByIdUseCase.js";

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
  return medias.map((media) => media.getTranslatedVersion(user.language));
}
