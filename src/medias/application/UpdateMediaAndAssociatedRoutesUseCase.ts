import { MongoMediaModel } from "../infrastructure/mongoModel/MongoMediaModel.js";
import { IMedia } from "../domain/interfaces/IMedia.js";
import { ApolloError } from "apollo-server-errors";
import { MongoPlaceModel } from "../../places/infrastructure/mongoModel/MongoPlaceModel.js";

export default async function UpdateMediaAndAssociatedRoutesUseCase(
  id: string,
  mediaUpdate: Partial<IMedia>
): Promise<IMedia> {
  const mediaUpdated = await MongoMediaModel.findByIdAndUpdate(
    id,
    mediaUpdate,
    { new: true }
  );
  if (mediaUpdated) {
    const place = await MongoPlaceModel.findById(mediaUpdated.placeId);
    if (!place) {
      throw new ApolloError("Place not found", "PLACE_NOT_FOUND");
    }
    return mediaUpdated;
  }
  throw new ApolloError("Media not found", "MEDIA_NOT_FOUND");
}
