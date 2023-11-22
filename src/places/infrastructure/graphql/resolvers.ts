import IPlace from "../../domain/interfaces/IPlace.js";
import PopulatePlacesByZoneUseCase from "../../application/PopulatePlacesByZoneUseCase.js";
import PopulatePlacesByNameUseCase from "../../application/PopulatePlaceByNameUseCase.js";
import GetPlaceByIdUseCase from "../../application/GetPlaceByIdUseCase.js";
import GetAllPlacesUseCase from "../../application/GetAllPlacesUseCase.js";
import DeletePlaceAndAssociatedMediaUseCase from "../../application/DeletePlaceAndAssociatedMediaUseCase.js";
import UpdatePlaceAndAssociatedMediaUseCase from "../../application/UpdatePlaceAndAssociatedMediaUseCase.js";
import { checkToken } from "../../../middleware/auth.js";

const resolvers = {
  Place: {
    // Resolver para el campo imagesUrl
    imagesUrl: (parent: IPlace) => parent.photos?.map((photo) => photo.url),
  },
  Query: {
    place: (_: any, args: { id: string }, { token }: { token: string }) => {
      checkToken(token);
      return GetPlaceByIdUseCase(args.id);
    },
    places: (_: any, args: any, { token }: { token: string }) => {
      checkToken(token);
      return GetAllPlacesUseCase();
    },
  },
  Mutation: {
    populatePlaceByZone: async (
      parent: any,
      args: { zone: string; number?: number },
      { token }: { token: string }
    ) => {
      checkToken(token);
      return PopulatePlacesByZoneUseCase({
        zone: args.zone,
        number: args.number,
      });
    },

    populatePlaceByName: async (
      parent: any,
      args: { name: string; addMedia?: boolean },
      { token }: { token: string }
    ) => {
      checkToken(token);
      return PopulatePlacesByNameUseCase({
        name: args.name,
        addMedia: args.addMedia,
      });
    },
    updatePlace: (
      parent: any,
      args: { id: string; placeUpdate: Partial<IPlace> },
      { token }: { token: string }
    ) => {
      checkToken(token);
      return UpdatePlaceAndAssociatedMediaUseCase(args.id, args.placeUpdate);
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
