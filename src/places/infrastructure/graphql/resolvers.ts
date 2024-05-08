import { IPlaceTranslated } from "../../domain/interfaces/IPlace.js";
import GetPlaceByIdUseCase from "../../application/GetPlaceByIdUseCase.js";
import GetPlacesUseCase from "../../application/GetPlacesUseCase.js";
import DeletePlaceAndAssociatedMediaUseCase from "../../application/DeletePlaceAndAssociatedMediaUseCase.js";
import UpdatePlaceUseCase from "../../application/UpdatePlaceUseCase.js";
import CreatePlaceUseCase from "../../application/CreatePlaceUseCase.js";
import UpdatePlacePhotos from "../../application/UpdatePlacePhotos.js";
import { SortField, SortOrder } from "../../domain/types/SortTypes.js";
import { checkToken } from "../../../middleware/auth.js";
import { ApolloError } from "apollo-server-errors";
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
import { IAddressTranslated } from "../../domain/interfaces/IAddress.js";
import { FromSupport } from "../../domain/types/FromSupportTypes.js";
import { Types } from "mongoose";
import IPhoto from "../../domain/interfaces/IPhoto.js";

const mediaCloudFrontUrl = process.env.MEDIA_CLOUDFRONT_URL;

interface IAddressInput extends Omit<IAddressTranslated, "coordinates"> {
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface IPlaceInput extends Omit<IPlaceTranslated, "address"> {
  address: IAddressInput;
}

export interface OldPhotosUpdateInput {
  id: string;
  order: number;
}

export interface NewPhotosUpdateInput {
  photoBase64: string;
  order: number;
  name: string;
}

const getCreatedBy = async (createdById: Types.ObjectId) => {
  const createdBy = await MongoUserModel.findById(createdById);
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
};

const resolvers = {
  Place: {
    imagesUrl: async (parent: IPlaceTranslated) => {
      if (!parent.imagesUrl) return [];
      return parent.imagesUrl.map((photo) => {
        return `${mediaCloudFrontUrl}/${photo}`;
      });
    },
    createdBy: async (parent: IPlaceTranslated) => {
      return getCreatedBy(parent.createdBy);
    },
    address: (parent: IPlaceTranslated) => {
      return {
        ...parent.address,
        coordinates: {
          lat: parent.address.coordinates.coordinates[1],
          lng: parent.address.coordinates.coordinates[0],
        },
      };
    },
    photos: async (parent: IPlaceTranslated) => {
      if (!parent.photos) return [];
      return await Promise.all(
        parent.photos
          .sort((a, b) => a.order - b.order)
          .map(async (photo: IPhoto) => {
            try {
              return {
                id: photo._id?.toString(),
                url: `${mediaCloudFrontUrl}/${photo.sizes.medium}`,
                sizes: {
                  small: `${mediaCloudFrontUrl}/${photo.sizes.small}`,
                  medium: `${mediaCloudFrontUrl}/${photo.sizes.medium}`,
                  large: `${mediaCloudFrontUrl}/${photo.sizes.large}`,
                  original: `${mediaCloudFrontUrl}/${photo.url}`,
                },
                createdBy: await getCreatedBy(photo.createdBy),
                order: photo.order || 0,
                createdAt: photo.createdAt,
                updatedAt: photo.updatedAt,
                name: photo.name,
              };
            } catch (e) {
              console.log(e);
            }
          })
      );
    },
  },

  Query: {
    place: (
      _: any,
      args: {
        id: string;
        imageSize: ImageSize;
        language?: Languages;
        isMobile?: boolean;
        fromSupport?: FromSupport;
      },
      { token }: { token: string }
    ) => {
      const { id: userId } = checkToken(token);
      if (!userId) throw new ApolloError("User not found", "USER_NOT_FOUND");
      return GetPlaceByIdUseCase(
        userId,
        args.id,
        args.imageSize,
        args.language,
        args.isMobile,
        args.fromSupport
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
      args: { place: IPlaceInput },
      { token }: { token: string }
    ) => {
      const { id: userId } = checkToken(token);
      if (!userId) throw new ApolloError("User not found", "USER_NOT_FOUND");
      return CreatePlaceUseCase(userId, {
        ...args.place,
        address: {
          ...args.place.address,
          coordinates: {
            type: "Point",
            coordinates: [
              args.place.address.coordinates.lng,
              args.place.address.coordinates.lat,
            ],
          },
        },
      });
    },
    updatePlace: async (
      parent: any,
      args: { id: string; placeUpdate: Partial<IPlaceInput> },
      { token }: { token: string }
    ) => {
      const { id: userId } = checkToken(token);
      if (!userId) throw new ApolloError("User not found", "USER_NOT_FOUND");
      const placeUpdated = await UpdatePlaceUseCase(
        userId,
        args.id,
        args.placeUpdate
      );
      return placeUpdated;
    },
    updatePlacePhotos: async (
      parent: any,
      args: {
        id: string;
        oldPhotos: OldPhotosUpdateInput[];
        newPhotos: NewPhotosUpdateInput[];
      },
      { token }: { token: string }
    ) => {
      const { id: userId } = checkToken(token);
      if (!userId) throw new ApolloError("User not found", "USER_NOT_FOUND");
      const { id, oldPhotos, newPhotos } = args;
      await UpdatePlacePhotos(userId, id, oldPhotos, newPhotos);
      return true;
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
