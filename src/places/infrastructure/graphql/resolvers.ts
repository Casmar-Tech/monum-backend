import { IPlace, IPlaceTranslated } from "../../domain/interfaces/IPlace.js";
import GetUniqueCitiesUseCase from "../../application/GetUniqueCitiesUseCase.js";
import GetPlacesFullUseCase from "../../application/GetPlacesFullUseCase.js";
import GetPlaceByIdUseCase from "../../application/GetPlaceByIdUseCase.js";
import GetPlacesUseCase from "../../application/GetPlacesUseCase.js";
import GetPlaceFullByIdUseCase from "../../application/GetPlaceFullByIdUseCase.js";
import DeletePlaceAndAssociatedMediaUseCase from "../../application/DeletePlaceAndAssociatedMediaUseCase.js";
import UpdatePlaceUseCase from "../../application/UpdatePlaceUseCase.js";
import CreatePlaceUseCase from "../../application/CreatePlaceUseCase.js";
import UpdatePlacePhotos from "../../application/UpdatePlacePhotos.js";
import CreatePlaceFullUseCase from "../../application/CreatePlaceFullUseCase.js";
import UpdatePlaceFullUseCase from "../../application/UpdatePlaceFullUseCase.js";
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
import IPhoto from "../../domain/interfaces/IPhoto.js";
import GetUserByIdUseCase from "../../../users/application/GetUserByIdUseCase.js";
import GetReviewsUseCase from "../../../reviews/application/GetReviewsUseCase.js";
import { MongoReviewModel } from "../../../reviews/infrastructure/mongoModel/MongoReviewModel.js";

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

export interface AddressFullInput {
  city: {
    key: string;
    value: string;
  }[];
  street: {
    key: string;
    value: string;
  }[];
  province: {
    key: string;
    value: string;
  }[];
  country: {
    key: string;
    value: string;
  }[];
  coordinates: {
    lat: number;
    lng: number;
  };
  postalCode: string;
}

export interface PlaceFullInput {
  name: string;
  nameTranslations: {
    key: string;
    value: string;
  }[];
  address: AddressFullInput;
  description: {
    key: string;
    value: string;
  }[];

  importance: number;
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
    reviews: async (parent: IPlaceTranslated) => {
      const reviews = await GetReviewsUseCase({
        entityId: parent._id?.toString() as string,
        entityType: "place",
      });
      if (reviews.length >= 5) {
        const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
        return {
          rating: sum / reviews.length,
          ratingCount: reviews.length,
          reviews: reviews,
        };
      } else {
        return { rating: null, ratingCount: null, reviews: [] };
      }
    },
    userReviewId: async (
      parent: IPlaceTranslated,
      args: any,
      { token }: { token: string }
    ) => {
      const { id: userId } = checkToken(token);
      if (!userId) throw new Error("User not found");
      const rating = await MongoReviewModel.findOne({
        entityId: parent._id?.toString(),
        entityType: "place",
        createdById: userId,
      });
      if (!rating) return null;
      return rating?._id?.toString();
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
    createdBy: async (parent: IPlace) => {
      return await GetUserByIdUseCase(parent.createdBy.toString());
    },
    reviews: async (parent: IPlace) => {
      const reviews = await GetReviewsUseCase({
        entityId: parent._id?.toString() as string,
        entityType: "place",
      });
      if (reviews.length >= 5) {
        const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
        return {
          rating: sum / reviews.length,
          ratingCount: reviews.length,
          reviews: reviews,
        };
      } else {
        return { rating: null, ratingCount: null, reviews: [] };
      }
    },
    userReviewId: async (
      parent: IPlace,
      args: any,
      { token }: { token: string }
    ) => {
      const { id: userId } = checkToken(token);
      if (!userId) throw new Error("User not found");
      const rating = await MongoReviewModel.findOne({
        entityId: parent._id?.toString(),
        entityType: "place",
        createdById: userId,
      });
      if (!rating) return null;
      return rating?._id?.toString();
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
    uniqueCities: (
      _: any,
      args: {
        textSearch: string;
      },
      { token }: { token: string }
    ) => {
      const { id: userId } = checkToken(token);
      if (!userId) throw new ApolloError("User not found", "USER_NOT_FOUND");
      return GetUniqueCitiesUseCase(userId, args.textSearch);
    },
    getPlaceBySearchAndPagination: async (
      _: any,
      args: {
        textSearch: string;
        cities?: [string];
        hasPhotos?: boolean;
        pageNumber: number;
        resultsPerPage: number;
        language?: Languages;
      },
      { token }: { token: string }
    ) => {
      const { id: userId } = checkToken(token);
      if (!userId) throw new ApolloError("User not found", "USER_NOT_FOUND");
      return GetPlaceBySearchAndPaginationUseCase({
        userId,
        textSearch: args.textSearch,
        cities: args.cities,
        hasPhotos: args.hasPhotos,
        pageNumber: args.pageNumber,
        resultsPerPage: args.resultsPerPage,
        language: args.language,
      });
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
    createPlaceFull: async (
      parent: any,
      args: { place: PlaceFullInput },
      { token }: { token: string }
    ) => {
      const { id: userId } = checkToken(token);
      if (!userId) throw new ApolloError("User not found", "USER_NOT_FOUND");
      const place = await CreatePlaceFullUseCase(userId, args.place);
      return place;
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
    updatePlaceFull: async (
      parent: any,
      args: { id: string; placeUpdate: Partial<PlaceFullInput> },
      { token }: { token: string }
    ) => {
      const { id: userId } = checkToken(token);
      if (!userId) throw new ApolloError("User not found", "USER_NOT_FOUND");
      const place = await UpdatePlaceFullUseCase(args.id, args.placeUpdate);
      return place;
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
