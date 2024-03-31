import { IPlace, IPlaceTranslated } from "../../domain/interfaces/IPlace.js";
import GetPlaceByIdUseCase from "../../application/GetPlaceByIdUseCase.js";
import GetPlacesUseCase from "../../application/GetPlacesUseCase.js";
import DeletePlaceAndAssociatedMediaUseCase from "../../application/DeletePlaceAndAssociatedMediaUseCase.js";
import UpdatePlaceUseCase from "../../application/UpdatePlaceUseCase.js";
import CreatePlaceUseCase from "../../application/CreatePlaceUseCase.js";
import { SortField, SortOrder } from "../../domain/types/SortTypes.js";
import { checkToken } from "../../../middleware/auth.js";
import { ApolloError } from "apollo-server-errors";
import { MongoPlaceSearchesModel } from "../../infrastructure/mongoModel/MongoPlaceSearchesModel.js";
import { ImageSize } from "../../domain/types/ImageTypes.js";
import { Languages } from "../../../shared/Types.js";
import GetPlaceBySearchAndPaginationUseCase from "../../application/GetPlacesBySearchAndPaginationUseCase.js";
import { MongoUserModel } from "../../../users/infrastructure/mongoModel/MongoUserModel.js";
import { MongoOrganizationModel } from "../../../organizations/infrastructure/mongoModel/MongoOrganizationModel.js";
import { getTranslatedOrganization } from "../../../organizations/domain/functions/Organization.js";
import {
  GetObjectCommand,
  HeadObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const mediaCloudFrontUrl = process.env.MEDIA_CLOUDFRONT_URL;

const resolvers = {
  Place: {
    imagesUrl: async (parent: IPlaceTranslated) => {
      const allPhotos: string[] = [];
      if (parent.mainPhoto) allPhotos.push(parent.mainPhoto);
      if (Array.isArray(parent.photos)) allPhotos.push(...parent.photos);

      const allPhotosUnique = Array.from(new Set(allPhotos)).slice(0, 5);
      const cloudFrontUrls = allPhotosUnique.map((photo) => {
        return `${mediaCloudFrontUrl}/${photo}`;
      });
      return cloudFrontUrls;
    },
    createdBy: async (parent: IPlaceTranslated) => {
      const createdBy = await MongoUserModel.findById(parent.createdBy);
      if (!createdBy) return null;
      const organization = await MongoOrganizationModel.findById(
        createdBy.organizationId
      );
      if (organization) {
        createdBy.organization = getTranslatedOrganization(
          organization.toObject(),
          createdBy.language
        );
      }
      const client = new S3Client({
        region: "eu-west-1",
      });
      const commandToCheck = new HeadObjectCommand({
        Bucket: process.env.S3_BUCKET_IMAGES!,
        Key: createdBy.id || createdBy._id?.toString() || "",
      });

      try {
        await client.send(commandToCheck);

        const commandToGet = new GetObjectCommand({
          Bucket: process.env.S3_BUCKET_IMAGES!,
          Key: createdBy.id || createdBy._id?.toString() || "",
        });

        const url = await getSignedUrl(client, commandToGet, {
          expiresIn: 3600 * 24,
        });
        createdBy.photo = url;
      } catch (error) {
        console.log(error);
      }
      return createdBy;
    },
  },

  Query: {
    place: (
      _: any,
      args: { id: string; imageSize: ImageSize; language?: Languages },
      { token }: { token: string }
    ) => {
      const { id: userId } = checkToken(token);
      if (!userId) throw new ApolloError("User not found", "USER_NOT_FOUND");
      return GetPlaceByIdUseCase(
        userId,
        args.id,
        args.imageSize,
        args.language
      );
    },
    places: (
      _: any,
      args: {
        textSearch: string;
        centerCoordinates?: [number, number];
        sortField?: SortField;
        sortOrder?: SortOrder;
        language?: Languages;
        imageSize: ImageSize;
      },
      { token }: { token: string }
    ) => {
      const { id: userId } = checkToken(token);
      if (!userId) throw new ApolloError("User not found", "USER_NOT_FOUND");
      if (args.centerCoordinates && args.centerCoordinates.length !== 2) {
        throw new ApolloError(
          "centerCoordinates must have exactly two elements."
        );
      }
      return GetPlacesUseCase(
        userId,
        args.textSearch,
        args.centerCoordinates,
        args.sortField,
        args.sortOrder,
        args.imageSize,
        args.language
      );
    },
    placeSearcherSuggestions: async (
      _: any,
      args: { textSearch: string },
      { token }: { token: string }
    ) => {
      checkToken(token);
      const placeSearcherSuggestions = await MongoPlaceSearchesModel.find({
        textSearch: { $regex: args.textSearch, $options: "i" },
      });
      const placeSuggestionsCounted = placeSearcherSuggestions.reduce(
        (acc, curr) => {
          if (acc[curr.textSearch]) {
            acc[curr.textSearch]++;
          } else {
            acc[curr.textSearch] = 1;
          }
          return acc;
        },
        {} as { [key: string]: number }
      );
      return Object.keys(placeSuggestionsCounted).sort(
        (a, b) => placeSuggestionsCounted[b] - placeSuggestionsCounted[a]
      );
    },
    getPlaceBySearchAndPagination: async (
      _: any,
      args: {
        textSearch: string;
        pageNumber: number;
        resultsPerPage: number;
      },
      { token }: { token: string }
    ) => {
      const { id: userId } = checkToken(token);
      if (!userId) throw new ApolloError("User not found", "USER_NOT_FOUND");
      return GetPlaceBySearchAndPaginationUseCase(
        userId,
        args.textSearch,
        args.pageNumber,
        args.resultsPerPage
      );
    },
  },
  Mutation: {
    createPlace: (
      parent: any,
      args: { place: IPlaceTranslated },
      { token }: { token: string }
    ) => {
      const { id: userId } = checkToken(token);
      if (!userId) throw new ApolloError("User not found", "USER_NOT_FOUND");
      return CreatePlaceUseCase(userId, args.place);
    },
    updatePlace: (
      parent: any,
      args: { id: string; placeUpdate: Partial<IPlace> },
      { token }: { token: string }
    ) => {
      const { id: userId } = checkToken(token);
      if (!userId) throw new ApolloError("User not found", "USER_NOT_FOUND");
      return UpdatePlaceUseCase(userId, args.id, args.placeUpdate);
    },
    deletePlace: (
      parent: any,
      args: { id: string },
      { token }: { token: string }
    ) => {
      checkToken(token);
      return DeletePlaceAndAssociatedMediaUseCase(args.id);
    },
  },
};

export default resolvers;
