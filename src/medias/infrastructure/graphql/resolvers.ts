import DeleteMediaAndUpdatedAssociatedRoutesUseCase from "../../application/DeleteMediaAndUpdatedAssociatedRoutesUseCase.js";
import GetMediaByIdUseCase from "../../application/GetMediaByIdUseCase.js";
import GetMediasByPlaceIdUseCase from "../../application/GetMediasByPlaceIdUseCase.js";
import PopulateMediaByNumberUseCase from "../../application/PopulateMediaByNumberUseCase.js";
import PopulateMediaByTopicUseCase from "../../application/PopulateMediaByTopicUseCase.js";
import TranslateMediaUseCase from "../../application/TranslateMediaUseCase.js";
import UpdateMediaAndAssociatedRoutesUseCase from "../../application/UpdateMediaAndAssociatedRoutesUseCase.js";
import IMedia from "../../domain/IMedia";
import { checkToken } from "../../../middleware/auth.js";

const resolvers = {
  Mutation: {
    populateMediaByNumber: async (
      parent: any,
      args: { placeId: string; number?: number; language?: any },
      { token }: { token: string }
    ) => {
      checkToken(token);
      return PopulateMediaByNumberUseCase({
        placeId: args.placeId,
        number: args.number,
        language: args.language?.replace("_", "-"),
      });
    },
    populateMediaByTopic: async (
      parent: any,
      args: {
        placeId: string;
        topic?: string;
        language?: any;
      },
      { token }: { token: string }
    ) => {
      checkToken(token);
      return PopulateMediaByTopicUseCase({
        placeId: args.placeId,
        topic: args.topic,
        language: args.language?.replace("_", "-"),
      });
    },

    translateMedia: async (
      parent: any,
      args: { id: string; outputLanguage: any },
      { token }: { token: string }
    ) => {
      checkToken(token);
      return TranslateMediaUseCase({
        id: args.id,
        outputLanguage: args.outputLanguage?.replace("_", "-"),
      });
    },
    updateMedia: (
      parent: any,
      args: { id: string; mediaUpdate: Partial<IMedia> },
      { token }: { token: string }
    ) => {
      checkToken(token);
      return UpdateMediaAndAssociatedRoutesUseCase(args.id, args.mediaUpdate);
    },
    deleteMedia: (
      parent: any,
      args: { id: string },
      { token }: { token: string }
    ) => {
      checkToken(token);
      return DeleteMediaAndUpdatedAssociatedRoutesUseCase(args.id);
    },
  },
  Query: {
    media: (
      parent: any,
      { id }: { id: string },
      { token }: { token: string }
    ) => {
      checkToken(token);
      return GetMediaByIdUseCase(id);
    },
    medias: async (
      parent: any,
      args: { placeId: string; language: string },
      { token }: { token: string }
    ) => {
      checkToken(token);
      return GetMediasByPlaceIdUseCase(args.placeId, args.language);
    },
  },
};

export default resolvers;
