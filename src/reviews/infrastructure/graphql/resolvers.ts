import { ApolloError } from "apollo-server-errors";
import { checkToken } from "../../../middleware/auth.js";
import CreateReviewUseCase from "../../application/CreateReviewUseCase.js";
import GetReviewsUseCase from "../../application/GetReviewsUseCase.js";
import { MongoUserModel } from "../../../users/infrastructure/mongoModel/MongoUserModel.js";

export interface CreateReviewInput {
  entityId: string;
  entityType: "route" | "place" | "media";
  rating: number;
  comment?: string;
}

export interface GetReviewsInput {
  entityId: string;
  entityType: "route" | "place" | "media";
}

const resolvers = {
  Review: {
    id: (parent: any) => parent?._id?.toString(),
    createdBy: async (parent: any) => {
      return MongoUserModel.findById(parent.createdById);
    },
  },
  Mutation: {
    createReview: async (
      parent: any,
      args: {
        review: CreateReviewInput;
      },
      { token }: { token: string }
    ) => {
      const { id: userId } = checkToken(token);
      if (!userId) throw new ApolloError("User not found", "USER_NOT_FOUND");

      const createdReview = await CreateReviewUseCase(args.review, userId);
      return createdReview;
    },
  },
  Query: {
    reviews: async (
      parent: any,
      args: { query: GetReviewsInput },
      { token }: { token: string }
    ) => {
      const { id: userId } = checkToken(token);
      if (!userId) throw new ApolloError("User not found", "USER_NOT_FOUND");
      const reviews = await GetReviewsUseCase(args.query);
      return reviews;
    },
  },
};

export default resolvers;
