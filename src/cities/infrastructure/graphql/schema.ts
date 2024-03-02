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
    imageUrl: String
  }

  enum Language {
    en_US
    es_ES
    fr_FR
    ca_ES
  }

  type Mutation {
    createCityByEnglishName(englishName: String): City
  }

  type Query {
    cities(textSearch: String, language: Language): [City]
  }
`;
export default typeDefs;
