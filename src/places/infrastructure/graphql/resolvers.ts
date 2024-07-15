import { IPlace, IPlaceTranslated } from "../../domain/interfaces/IPlace.js";
import GetPlacesFullUseCase from "../../application/GetPlacesFullUseCase.js";
import GetPlaceByIdUseCase from "../../application/GetPlaceByIdUseCase.js";
import GetPlacesUseCase from "../../application/GetPlacesUseCase.js";
import GetPlaceFullByIdUseCase from "../../application/GetPlaceFullByIdUseCase.js";
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
import {
  IAddress,
  IAddressTranslated,
} from "../../domain/interfaces/IAddress.js";
import { FromSupport } from "../../domain/types/FromSupportTypes.js";
import IPhoto, { IPhotoExisting } from "../../domain/interfaces/IPhoto.js";
import GetUserByIdUseCase from "../../../users/application/GetUserByIdUseCase.js";

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

const resolvers = {
  PlacePhoto: {
    id: (parent: IPhoto) => parent._id?.toString(),
    url: (parent: IPhoto) => `${mediaCloudFrontUrl}/${parent.sizes.medium}`,
    sizes: (parent: IPhoto) => {
      return {
        small: `${mediaCloudFrontUrl}/${parent.sizes.small}`,
        medium: `${mediaCloudFrontUrl}/${parent.sizes.medium}`,
        large: `${mediaCloudFrontUrl}/${parent.sizes.large}`,
        original: `${mediaCloudFrontUrl}/${parent.url}`,
      };
    },
    createdBy: async (parent: IPhoto) =>
      await GetUserByIdUseCase(parent.createdBy.toString()),
    order: (parent: IPhoto) => parent.order || 0,
  },
  AddressFull: {
    city: (parent: IAddress) => {
      return Object.entries(parent.city).map(([key, value]) => {
        return { key, value };
      });
    },
    street: (parent: IAddress) => {
      return parent.street
        ? Object.entries(parent.street).map(([key, value]) => {
            return { key, value };
          })
        : [];
    },
    province: (parent: IAddress) => {
      return parent.province
        ? Object.entries(parent.province).map(([key, value]) => {
            return { key, value };
          })
        : [];
    },
    country: (parent: IAddress) => {
      return Object.entries(parent.country).map(([key, value]) => {
        return { key, value };
      });
    },
    coordinates: (parent: IAddress) => {
      return {
        lat: parent.coordinates.coordinates[1],
        lng: parent.coordinates.coordinates[0],
      };
    },
  },
  Address: {
    coordinates: (parent: IAddressTranslated) => {
      return {
        lat: parent.coordinates.coordinates[1],
        lng: parent.coordinates.coordinates[0],
      };
    },
  },
  Place: {
    id: (parent: IPlaceTranslated) => parent._id?.toString(),
    imagesUrl: async (parent: IPlaceTranslated) => {
      if (!parent.imagesUrl) return [];
      return parent.imagesUrl.map((photo) => {
        return `${mediaCloudFrontUrl}/${photo}`;
      });
    },
    createdBy: async (parent: IPlaceTranslated) => {
      return await GetUserByIdUseCase(parent.createdBy.toString());
    },
  },
  PlaceFull: {
    id: (parent: IPlace) => parent._id?.toString(),
    nameTranslations: (parent: IPlace) => {
      return parent.nameTranslations
        ? Object.entries(parent.nameTranslations).map(([key, value]) => {
            return { key, value };
          })
        : [];
    },
    imagesUrl: async (parent: IPlaceTranslated) => {
      if (!parent.imagesUrl) return [];
      return parent.imagesUrl.map((photo) => {
        return `${mediaCloudFrontUrl}/${photo}`;
      });
    },
    description: (parent: IPlace) => {
      return parent.description
        ? Object.entries(parent.description).map(([key, value]) => {
            return { key, value };
          })
        : [];
    },
    createdBy: async (parent: IPlaceTranslated) => {
      return await GetUserByIdUseCase(parent.createdBy.toString());
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
    placeFull: (
      _: any,
      args: {
        id: string;
        imageSize: ImageSize;
        isMobile?: boolean;
        fromSupport?: FromSupport;
      },
      { token }: { token: string }
    ) => {
      const { id: userId } = checkToken(token);
      if (!userId) throw new ApolloError("User not found", "USER_NOT_FOUND");
      return GetPlaceFullByIdUseCase(
        userId,
        args.id,
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
    placesFull: (
      _: any,
      args: {
        textSearch: string;
      },
      { token }: { token: string }
    ) => {
      const { id: userId } = checkToken(token);
      if (!userId) throw new ApolloError("User not found", "USER_NOT_FOUND");
      return GetPlacesFullUseCase(args.textSearch);
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
