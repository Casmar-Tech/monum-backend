import DeleteMediaAndUpdatedAssociatedRoutesUseCase from "../../application/DeleteMediaAndUpdatedAssociatedRoutesUseCase.js";
import GetMediaByIdUseCase from "../../application/GetMediaByIdUseCase.js";
import GetMediasByPlaceIdUseCase from "../../application/GetMediasByPlaceIdUseCase.js";
import TranslateMedia from "../../application/TranslateMedia.js";
import CreateMediaUseCase from "../../application/CreateMediaUseCase.js";
import UpdateMediaAndAssociatedRoutesUseCase from "../../application/UpdateMediaAndAssociatedRoutesUseCase.js";
import { IMedia, IMediaTranslated } from "../../domain/interfaces/IMedia.js";
import { checkToken } from "../../../middleware/auth.js";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Languages } from "../../../shared/Types.js";
import { Types } from "mongoose";
import { IMediaTopic } from "../../domain/interfaces/IMediaTopic.js";
import GetUserByIdUseCase from "../../../users/application/GetUserByIdUseCase.js";
import { MediaType } from "../../domain/types/MediaType.js";

const client = new S3Client({
  region: "eu-west-1",
});

const resolvers = {
  Media: {
    url: async (parent: IMediaTranslated) => {
      if (!parent.url) return null;
      const commandToGet = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_AUDIOS!,
        Key: parent.url,
      });
      const url = await getSignedUrl(client, commandToGet, {
        expiresIn: 3600,
      });
      return url;
    },
  },
  Mutation: {
    createMedia: async (
      parent: any,
      args: {
        placeId: string;
        title: string;
        text: string;
        type: MediaType;
        rating: number;
        videoBase64?: string;
      },
      { token }: { token: string }
    ) => {
      const { id: userId } = checkToken(token);
      if (!userId) throw new Error("User not found");
      const user = await GetUserByIdUseCase(userId);
      let videoBase64: string | undefined;

      // Check if type is 'video' and if videoBase64 is provided
      if (args.type === "video" && args.videoBase64) {
        videoBase64 = args.videoBase64;
      }

      return CreateMediaUseCase(
        args.placeId,
        user.language,
        args.title,
        args.type,
        args.rating,
        args.text,
        videoBase64
      );
    },
    translateMedia: async (
      parent: any,
      args: { id: string; outputLanguage: any },
      { token }: { token: string }
    ) => {
      checkToken(token);
      return TranslateMedia(args.id, args.outputLanguage);
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
      { id, language }: { id: string; language?: Languages },
      { token }: { token: string }
    ) => {
      const { id: userId } = checkToken(token);
      if (!userId) throw new Error("User not found");
      return GetMediaByIdUseCase(id, userId, language);
    },
    medias: async (
      parent: any,
      args: { placeId: string; language?: Languages },
      { token }: { token: string }
    ) => {
      const { id: userId } = checkToken(token);
      if (!userId) throw new Error("User not found");
      return GetMediasByPlaceIdUseCase(userId, args.placeId, args.language);
    },
  },
};

export default resolvers;
