import { MongoPlaceModel } from "../infrastructure/mongoModel/MongoPlaceModel.js";
import { MongoMediaModel } from "../../medias/infrastructure/mongoModel/MongoMediaModel.js";
import { ApolloError } from "apollo-server-errors";
import DeleteMediaAndUpdatedAssociatedRoutesUseCase from "../../medias/application/DeleteMediaAndUpdatedAssociatedRoutesUseCase.js";
import { IPlace } from "../domain/interfaces/IPlace.js";

export default async function DeletePlaceAndAssociatedMediaUseCase(
  placeId: string
): Promise<boolean> {
  try {
    const mediasAssociated = await MongoMediaModel.find({
      placeId: placeId,
    });
    for (const media of mediasAssociated) {
      media.deleted = true;
      await media.save();
      // await DeleteMediaAndUpdatedAssociatedRoutesUseCase(media._id.toString());
    }
    //perform soft delete setting deleted = true
    const place = await MongoPlaceModel.findById(placeId);
    if (!place) {
      throw new ApolloError("Place not found", "PLACE_NOT_FOUND");
    }
    place.deleted = true;
    await place.save();
    // await MongoPlaceModel.findByIdAndRemove(placeId, { lean: true });
    return true;
  } catch (error) {
    console.error("Error while deleting Place and associated Media", error);
    throw new ApolloError(
      "Error while deleting Place and associated Media",
      "DELETE_PLACE_AND_ASSOCIATED_MEDIA"
    );
  }
}
