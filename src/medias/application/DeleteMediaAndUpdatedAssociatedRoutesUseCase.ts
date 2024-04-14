import { ApolloError } from "apollo-server-errors";
import { MongoMediaModel } from "../infrastructure/mongoModel/MongoMediaModel.js";

export default async function DeleteMediaAndUpdatedAssociatedRoutesUseCase(
  id: string
): Promise<boolean> {
  try {
    const filter = { _id: id };
    const update = { deleted: true };
    await MongoMediaModel.findOneAndUpdate(filter, update, {
      new: true, // return the updated document
      useFindAndModify: false, // to use MongoDB driver's findOneAndUpdate() instead of findAndModify()
    });
    return true;
  } catch (error) {
    console.error("Error while deleting Media.", error);
    throw new ApolloError("Error while deleting Media", "DELETE_MEDIA_ERROR");
  }
}
