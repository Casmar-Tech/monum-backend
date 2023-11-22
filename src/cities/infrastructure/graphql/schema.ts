import gql from "graphql-tag";

const typeDefs = gql`
  type Translations {
    es_ES: String
    en_US: String!
    ca_ES: String
    fr_FR: String
  }

  type Photo {
    id: String!
    url: String!
    width: Int!
    height: Int!
  }

  type City {
    id: ID!
    translations: Translations!
    imageUrl: String
  }

  type Mutation {
    createCityByEnglishName(englishName: String): City
  }

  type Query {
    cities(textSearch: String): [City]
  }
`;
export default typeDefs;
