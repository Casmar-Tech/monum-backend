import DeleteMediaAndUpdatedAssociatedRoutesUseCase from "../../application/DeleteMediaAndUpdatedAssociatedRoutesUseCase.js";
import GetMediaByIdUseCase from "../../application/GetMediaByIdUseCase.js";
import GetMediasByPlaceIdUseCase from "../../application/GetMediasByPlaceIdUseCase.js";
import GetMediasFullByPlaceIdUseCase from "../../application/GetMediasFullByPlaceIdUseCase.js";
import TranslateMedia from "../../application/TranslateMedia.js";
import CreateMediaUseCase from "../../application/CreateMediaUseCase.js";
import UpdateMediaAndAssociatedRoutesUseCase from "../../application/UpdateMediaAndAssociatedRoutesUseCase.js";
import CreateMediaFullUseCase from "../../application/CreateMediaFullUseCase.js";
import UpdateMediaFullUseCase from "../../application/UpdateMediaFullUseCase.js";
import { IMedia, IMediaTranslated } from "../../domain/interfaces/IMedia.js";
import { checkToken } from "../../../middleware/auth.js";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Languages } from "../../../shared/Types.js";
import GetUserByIdUseCase from "../../../users/application/GetUserByIdUseCase.js";
import { MediaType } from "../../domain/types/MediaType.js";
import { MongoMediaModel } from "../mongoModel/MongoMediaModel.js";
import { MongoPlaceModel } from "../../../places/infrastructure/mongoModel/MongoPlaceModel.js";
import GetReviewsUseCase from "../../../reviews/application/GetReviewsUseCase.js";
import { MongoReviewModel } from "../../../reviews/infrastructure/mongoModel/MongoReviewModel.js";

const client = new S3Client({
  region: "eu-west-1",
});

export interface CreateMediaFullInput {
  placeId: string;
  title: {
    key: string;
    value: string;
  }[];
  text: {
    key: string;
    value: string;
  }[];
  type: MediaType;
  videoBase64?: {
    key: string;
    value: string;
  }[];
  videoDurationInSeconds?: {
    key: string;
    value: number;
  }[];
}

export interface UpdateMediaFullInput {
  placeId: string;
  title: {
    key: string;
    value: string;
  }[];
  text: {
    key: string;
    value: string;
  }[];
  type: MediaType;
  videoBase64?: {
    key: string;
    value: string;
  }[];
  videoDurationInSeconds?: {
    key: string;
    value: number;
  }[];
  videosToDelete?: Languages[];
}

const resolvers = {
  Media: {
    id: (parent: IMediaTranslated) => parent?._id?.toString(),
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
    duration: (parent: IMediaTranslated) => parent.duration || 0,
    rating: async (parent: IMediaTranslated) => {
      const ratings = await GetReviewsUseCase({
        entityId: parent._id?.toString() as string,
        entityType: "media",
      });
      if (ratings.length >= 5) {
        const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
        return sum / ratings.length;
      } else {
        return parent.rating;
      }
    },
    reviews: async (parent: IMediaTranslated) => {
      const reviews = await GetReviewsUseCase({
        entityId: parent._id?.toString() as string,
        entityType: "media",
      });
      if (reviews.length >= 5) {
        const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
        return {
          rating: sum / reviews.length,
          ratingCount: reviews.length,
          reviews: reviews,
        };
      } else {
        return { rating: parent.rating, ratingCount: null, reviews: [] };
      }
    },
    userReviewId: async (
      parent: IMediaTranslated,
      args: any,
      { token }: { token: string }
    ) => {
      const { id: userId } = checkToken(token);
      if (!userId) throw new Error("User not found");
      const rating = await MongoReviewModel.findOne({
        entityId: parent._id?.toString(),
        entityType: "media",
        createdById: userId,
      });
      if (!rating) return null;
      return rating?._id?.toString();
    },
  },
  MediaFull: {
    id: (parent: IMedia) => parent?._id?.toString(),
    title: (parent: IMedia) => {
      return Object.entries(parent.title).map(([key, value]) => {
        return { key, value };
      });
    },
    text: (parent: IMedia) => {
      return Object.entries(parent.text || {}).map(([key, value]) => {
        return { key, value };
      });
    },
    url: async (parent: IMedia) => {
      if (!parent.url) return null;
      return await Promise.all(
        Object.entries(parent.url)?.map(async ([key, value]) => {
          const commandToGet = new GetObjectCommand({
            Bucket: process.env.S3_BUCKET_AUDIOS!,
            Key: value,
          });
          const url = await getSignedUrl(client, commandToGet, {
            expiresIn: 3600,
          });
          return {
            key,
            value: url,
          };
        })
      );
    },
    voiceId: (parent: IMedia) => {
      return Object.entries(parent.voiceId || {}).map(([key, value]) => {
        return { key, value };
      });
    },
    duration: (parent: IMedia) => {
      return Object.entries(parent.duration || {}).map(([key, value]) => {
        return { key, value };
      });
    },
    place: async (parent: IMedia) =>
      await MongoPlaceModel.findById(parent.placeId),
    rating: async (parent: IMedia) => {
      const ratings = await GetReviewsUseCase({
        entityId: parent._id?.toString() as string,
        entityType: "media",
      });
      if (ratings.length >= 5) {
        const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
        return sum / ratings.length;
      } else {
        return parent.rating;
      }
    },
    reviews: async (parent: IMedia) => {
      const reviews = await GetReviewsUseCase({
        entityId: parent._id?.toString() as string,
        entityType: "media",
      });
      if (reviews.length >= 5) {
        const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
        return {
          rating: sum / reviews.length,
          ratingCount: reviews.length,
          reviews: reviews,
        };
      } else {
        return { rating: parent.rating, ratingCount: null, reviews: [] };
      }
    },
    userReviewId: async (
      parent: IMedia,
      args: any,
      { token }: { token: string }
    ) => {
      const { id: userId } = checkToken(token);
      if (!userId) throw new Error("User not found");
      const rating = await MongoReviewModel.findOne({
        entityId: parent._id?.toString(),
        entityType: "media",
        createdById: userId,
      });
      if (!rating) return null;
      return rating?._id?.toString();
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
        rating?: number;
        videoBase64?: string;
        videoDurationInSeconds?: number;
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
        args.text,
        videoBase64,
        args.videoDurationInSeconds,
        args.rating
      );
    },
    createMediaFull: async (
      parent: any,
      args: { createMediaFull: CreateMediaFullInput },
      { token }: { token: string }
    ) => {
      const { id: userId } = checkToken(token);
      if (!userId) throw new Error("User not found");
      return CreateMediaFullUseCase(userId, args.createMediaFull);
    },
    updateMediaFull: async (
      parent: any,
      args: { updateMediaFull: UpdateMediaFullInput; id: string },
      { token }: { token: string }
    ) => {
      const { id: userId } = checkToken(token);
      if (!userId) throw new Error("User not found");
      return UpdateMediaFullUseCase(userId, args.id, args.updateMediaFull);
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
      args: { placeId: string; language?: Languages; textSearch?: string },
      { token }: { token: string }
    ) => {
      const { id: userId } = checkToken(token);
      if (!userId) throw new Error("User not found");
      return GetMediasByPlaceIdUseCase(
        userId,
        args.placeId,
        args.language,
        args.textSearch
      );
    },
    mediaFull: async (
      parent: any,
      args: { id: string },
      { token }: { token: string }
    ) => {
      const { id: userId } = checkToken(token);
      if (!userId) throw new Error("User not found");
      const media = await MongoMediaModel.findById(args.id);
      if (!media) throw new Error("Media not found");
      return media;
    },
    mediasFull: async (
      parent: any,
      args: { placeId: string; textSearch?: string },
      { token }: { token: string }
    ) => {
      const { id: userId } = checkToken(token);
      if (!userId) throw new Error("User not found");
      return GetMediasFullByPlaceIdUseCase(args.placeId, args.textSearch);
    },
  },
};

export default resolvers;
