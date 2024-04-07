import gql from "graphql-tag";

const typeDefs = gql`
  input GetMapSearcherResultsInput {
    textSearch: String
    coordinates: CoordinatesInput
  }

  enum MapSearcherType {
    place
    city
  }

  type MapSearcherResult {
    id: ID
    name: String
    city: String!
    region: String
    country: String!
    coordinates: Coordinates
    distance: Float!
    importance: Int
    hasMonums: Boolean
    type: MapSearcherType!
  }

  type Query {
    getMapSearcherResults(
      getMapSearcherResultsInput: GetMapSearcherResultsInput!
    ): [MapSearcherResult]
  }
`;

export default typeDefs;
