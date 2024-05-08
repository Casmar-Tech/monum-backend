import GetRouteByIdUseCase from "../../application/GetRouteByIdUseCase.js";
import GetRoutesByFiltersUseCase from "../../application/GetRoutesByFiltersUseCase.js";
import { checkToken } from "../../../middleware/auth.js";
import { IRoute } from "../../domain/interfaces/IRoute.js";
import { ApolloError } from "apollo-server-errors";
import {
  GetObjectCommand,
  HeadObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { IMediaTranslated } from "../../../medias/domain/interfaces/IMedia.js";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { IPlaceTranslated } from "../../../places/domain/interfaces/IPlace.js";
import { getTranslatedOrganization } from "../../../organizations/domain/functions/Organization.js";
import { MongoOrganizationModel } from "../../../organizations/infrastructure/mongoModel/MongoOrganizationModel.js";
import { MongoUserModel } from "../../../users/infrastructure/mongoModel/MongoUserModel.js";
import { Types } from "mongoose";

const client = new S3Client({
  region: "eu-west-1",
});
const mediaCloudFrontUrl = process.env.MEDIA_CLOUDFRONT_URL;

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

  Place: {
    imagesUrl: async (parent: IPlaceTranslated) => {
      if (!parent.imagesUrl) return [];
      return parent.imagesUrl.slice(0, 5).map((photo) => {
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
          .map(async (photo) => {
            return {
              url: `${mediaCloudFrontUrl}/${photo.sizes.medium}`,
              sizes: {
                small: `${mediaCloudFrontUrl}/${photo.sizes.small}`,
                medium: `${mediaCloudFrontUrl}/${photo.sizes.medium}`,
                large: `${mediaCloudFrontUrl}/${photo.sizes.large}`,
                original: `${mediaCloudFrontUrl}/${photo.url}`,
              },
              createdBy: await getCreatedBy(photo.createdBy),
              order: photo.order,
              createdAt: photo.createdAt,
              updatedAt: photo.updatedAt,
            };
          })
      );
    },
  },

  Route: {
    stopsCount: (parent: IRoute) => parent.stops.length,
  },

  Query: {
    route: async (
      parent: any,
      args: { id: string },
      { token }: { token: string }
    ) => {
      const { id: userId } = checkToken(token);
      if (!userId) throw new ApolloError("User not found", "USER_NOT_FOUND");
      const route = await GetRouteByIdUseCase(userId, args.id);
      return route;
    },
    routes: async (
      parent: any,
      args: { cityId: string; textSearch: string },
      { token }: { token: string }
    ) => {
      const { id: userId } = checkToken(token);
      if (!userId) throw new ApolloError("User not found", "USER_NOT_FOUND");
      const routes = await GetRoutesByFiltersUseCase(
        userId,
        args.cityId,
        args.textSearch
      );
      return routes;
    },
  },
};

export default resolvers;
