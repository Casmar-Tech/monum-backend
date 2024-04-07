import { checkToken } from "../../../middleware/auth.js";
import { ApolloError } from "apollo-server-errors";
import GetMapSearcherResults from "../../application/GetMapSearcherResults.js";
import { ISearchResult } from "../../domain/interfaces/ISearchResult.js";

interface getMapSearcherResultsInput {
  getMapSearcherResultsInput: {
    textSearch?: string;
    coordinates: {
      lng: number;
      lat: number;
    };
  };
}

const resolvers = {
  MapSearcherResult: {
    coordinates: (parent: ISearchResult) => {
      return {
        lng: parent.coordinates.coordinates[0],
        lat: parent.coordinates.coordinates[1],
      };
    },
  },
  Query: {
    getMapSearcherResults: async (
      _: any,
      args: getMapSearcherResultsInput,
      { token }: { token: string }
    ) => {
      const { textSearch, coordinates } = args.getMapSearcherResultsInput;
      const { id: userId } = checkToken(token);
      if (!userId) throw new ApolloError("User not found", "USER_NOT_FOUND");
      const searcherResults = await GetMapSearcherResults({
        textSearch: textSearch || "",
        coordinates: [coordinates.lng, coordinates.lat],
        userId,
      });
      return searcherResults;
    },
  },
};

export default resolvers;
