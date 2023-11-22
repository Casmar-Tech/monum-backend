import { checkToken } from "../../../middleware/auth.js";
import CreateCityByEnglishNameUseCase from "../../application/CreateCityByEnglishNameUseCase.js";
import GetCitiesByTextSearchUseCase from "../../application/GetCitiesByTextSearchUseCase.js";
import ICity from "../../domain/interfaces/ICity.js";

const resolvers = {
  City: {
    // Resolver para el campo imageUrl
    imageUrl: (parent: ICity) => parent.photo.url,
  },
  Mutation: {
    createCityByEnglishName: async (
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
      args: { textSearch: string },
      { token }: { token: string }
    ) => {
      checkToken(token);
      const cities = await GetCitiesByTextSearchUseCase(args.textSearch);
      return cities;
    },
  },
};

export default resolvers;
