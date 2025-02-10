import { ApolloError } from "apollo-server-errors";
import { checkToken } from "../../../middleware/auth.js";
import CreateCityByEnglishNameUseCase from "../../application/CreateCityByEnglishNameUseCase.js";
import GetCitiesByTextSearchUseCase from "../../application/GetCitiesByTextSearchUseCase.js";
import GetCitiesFullByTextSearchUseCase from "../../application/GetCitiesFullByTextSearchUseCase.js";
import { ICity } from "../../domain/interfaces/ICity.js";
import { Languages } from "../../../shared/Types.js";

const resolvers = {
  City: {
    id: (parent: ICity) => parent?._id?.toString(),
    imageUrl: (parent: ICity) => parent.photo?.url,
    coordinates: (parent: ICity) => {
      return {
        lat: parent.coordinates.coordinates[1],
        lng: parent.coordinates.coordinates[0],
      };
    },
  },
  CityFull: {
    id: (parent: ICity) => parent?._id?.toString(),
    imageUrl: (parent: ICity) => parent.photo?.url,
    coordinates: (parent: ICity) => {
      return {
        lat: parent.coordinates.coordinates[1],
        lng: parent.coordinates.coordinates[0],
      };
    },
    name: (parent: ICity) => {
      return Object.entries(parent.name).map(([key, value]) => {
        return { key, value };
      });
    },
  },

  Mutation: {
    createCity: async (
      parent: any,
      args: {
        englishName: string;
      },
      { token }: { token: string }
    ) => {
      checkToken(token);
      const city = await CreateCityByEnglishNameUseCase(args.englishName);
      return city;
    },
  },
  Query: {
    cities: async (
      parent: any,
      args: { textSearch: string; language?: Languages; hasRoutes?: boolean },
      { token }: { token: string }
    ) => {
      const { id: userId } = checkToken(token);
      if (!userId) throw new ApolloError("User not found", "USER_NOT_FOUND");
      const cities = await GetCitiesByTextSearchUseCase(
        args.textSearch,
        userId,
        args.language,
        args.hasRoutes
      );
      return cities;
    },
    citiesFull: async (
      parent: any,
      args: { textSearch: string; language?: Languages; hasRoutes?: boolean },
      { token }: { token: string }
    ) => {
      const { id: userId } = checkToken(token);
      if (!userId) throw new ApolloError("User not found", "USER_NOT_FOUND");
      const cities = await GetCitiesFullByTextSearchUseCase(
        args.textSearch,
        userId
      );
      return cities;
    },
  },
};

export default resolvers;
