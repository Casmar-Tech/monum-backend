import IPlace from "../domain/interfaces/IPlace.js";
import { MongoPlaceModel } from "../infrastructure/mongoModel/MongoPlaceModel.js";
import { MongoMediaModel } from "../../medias/infrastructure/mongoModel/MongoMediaModel.js";
import UpdateMediaAndAssociatedRoutesUseCase from "../../medias/application/UpdateMediaAndAssociatedRoutesUseCase.js";

export default async function UpdatePlaceAndAssociatedMediaUseCase(
  placeId: string,
  placeUpdate: Partial<IPlace>
): Promise<IPlace | null> {
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
  }
  return placeUpdated;
}
