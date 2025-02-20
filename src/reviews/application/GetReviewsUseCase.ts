import IReview from "../domain/interfaces/IReview.js";
import { GetReviewsInput } from "../infrastructure/graphql/resolvers.js";
import { MongoReviewModel } from "../infrastructure/mongoModel/MongoReviewModel.js";

export default async function GetReviewsUseCase(
  query: GetReviewsInput
): Promise<IReview[]> {
  try {
    return await MongoReviewModel.find(query);
  } catch (error) {
    console.log(error);
    throw error;
  }
}
