import { IPlace, IPlaceSimplified } from "../domain/interfaces/IPlace.js";
import { MongoPlaceModel } from "../infrastructure/mongoModel/MongoPlaceModel.js";
import { MongoMediaModel } from "../../medias/infrastructure/mongoModel/MongoMediaModel.js";
import UpdateMediaAndAssociatedRoutesUseCase from "../../medias/application/UpdateMediaAndAssociatedRoutesUseCase.js";
import GetUserByIdUseCase from "../../users/application/GetUserByIdUseCase.js";
import { ApolloError } from "apollo-server-errors";

export default async function UpdatePlaceAndAssociatedMediaUseCase(
  userId: string,
  placeId: string,
  placeUpdate: Partial<IPlace>
): Promise<IPlaceSimplified> {
  const user = await GetUserByIdUseCase(userId);
  const placeUpdated = await MongoPlaceModel.findByIdAndUpdate(
    placeId,
    placeUpdate,
    { new: true }
  );
  if (placeUpdated) {
    const mediasToBeUpdated = await MongoMediaModel.find({
      "place._id": placeId,
    });
    for (const media of mediasToBeUpdated) {
      await UpdateMediaAndAssociatedRoutesUseCase(media._id.toString(), {
        place: placeUpdated,
      });
    }
    return placeUpdated?.getSimplifiedVersion(user.language);
  }
  throw new ApolloError("Place not found", "PLACE_NOT_FOUND");
}
