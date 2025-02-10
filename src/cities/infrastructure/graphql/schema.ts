import gql from "graphql-tag";

const typeDefs = gql`
  type Photo {
    id: String!
    url: String!
    width: Int!
    height: Int!
  }

  type City {
    id: ID!
    name: String!
    province: String!
    county: String!
    country: String!
    coordinates: Coordinates!
    population: Int
    hasRoutes: Boolean
    imageUrl: String
  }

  type CityFull {
    id: ID!
    name: [KeyValuePair!]!
    province: [KeyValuePair!]!
    county: [KeyValuePair]
    country: [KeyValuePair!]!
    coordinates: Coordinates!
    population: Int
    hasRoutes: Boolean
    imageUrl: String
  }

  type Mutation {
    createCity(englishName: String): City
  }

  type Query {
    cities(textSearch: String, language: Language, hasRoutes: Boolean): [City!]!
    citiesFull(
      textSearch: String
      language: Language
      hasRoutes: Boolean
    ): [CityFull!]!
  }
`;
export default typeDefs;
