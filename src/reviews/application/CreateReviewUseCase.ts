import IReview from "../domain/interfaces/IReview.js";
import { CreateReviewInput } from "../infrastructure/graphql/resolvers.js";
import { MongoReviewModel } from "../infrastructure/mongoModel/MongoReviewModel.js";

export default async function CreateReviewUseCase(
  review: CreateReviewInput,
  userId: string
): Promise<IReview> {
  if (review?.rating < 0 || review?.rating > 5) {
    throw new Error("Rating must be between 0 and 5.");
  }
  const existingReview = await MongoReviewModel.findOne({
    entityId: review.entityId,
    entityType: review.entityType,
    createdById: userId,
  });
  if (existingReview) {
    throw new Error("You have already reviewed this entity.");
  }
  return await MongoReviewModel.create({
    ...review,
    createdById: userId,
  });
}
