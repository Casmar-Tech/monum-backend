import { ApolloError } from "apollo-server-errors";
import { checkToken } from "../../../middleware/auth.js";
import CreateCityByEnglishNameUseCase from "../../application/CreateCityByEnglishNameUseCase.js";
import GetCitiesByTextSearchUseCase from "../../application/GetCitiesByTextSearchUseCase.js";
import { ICity } from "../../domain/interfaces/ICity.js";
import { Languages } from "../../../shared/Types.js";

const resolvers = {
  City: {
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
      args: { textSearch: string; language?: Languages },
      { token }: { token: string }
    ) => {
      const { id: userId } = checkToken(token);
      if (!userId) throw new ApolloError("User not found", "USER_NOT_FOUND");
      const cities = await GetCitiesByTextSearchUseCase(
        args.textSearch,
        userId,
        args.language
      );
      return cities;
    },
  },
};

export default resolvers;
