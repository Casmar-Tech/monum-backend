import GetRouteByIdUseCase from "../../application/GetRouteByIdUseCase.js";
import GetRoutesByFiltersUseCase from "../../application/GetRoutesByFiltersUseCase.js";
import { checkToken } from "../../../middleware/auth.js";
import { IRoute } from "../../domain/interfaces/IRoute.js";
import { ApolloError } from "apollo-server-errors";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { IMediaTranslated } from "../../../medias/domain/interfaces/IMedia.js";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { IPlaceTranslated } from "../../../places/domain/interfaces/IPlace.js";
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

  Place: {
    imagesUrl: async (parent: IPlaceTranslated) => {
      const allPhotos: string[] = [];
      if (parent.mainPhoto) allPhotos.push(parent.mainPhoto);
      if (Array.isArray(parent.photos)) allPhotos.push(...parent.photos);

      const allPhotosUnique = Array.from(new Set(allPhotos)).slice(0, 5);

      return await Promise.all(
        allPhotosUnique?.map(async (photo) => {
          const commandToGet = new GetObjectCommand({
            Bucket: process.env.S3_BUCKET_PLACES_IMAGES!,
            Key: photo,
          });
          const url = await getSignedUrl(client, commandToGet, {
            expiresIn: 3600 * 24,
          });
          return url;
        })
      );
    },
    importance: (parent: IPlaceTranslated) =>
      parent.importance
        ? parent.importance === 10
          ? 6
          : Math.ceil(parent.importance / 2)
        : 0,
    rating: (parent: IPlaceTranslated) => parent.rating || 0,
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
