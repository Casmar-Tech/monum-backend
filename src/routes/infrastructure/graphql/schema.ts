import gql from "graphql-tag";

const typeDefs = gql`
  enum Language {
    en_US
    es_ES
    fr_FR
    ca_ES
  }

  type Place {
    id: ID
    name: String!
    address: Address!
    description: String!
    importance: Int!
    imagesUrl: [String]
  }

  type Stop {
    place: Place!
    medias: [Media]!
    order: Int!
    optimizedOrder: Int!
  }

  type Route {
    id: ID!
    title: String!
    description: String!
    rating: Float!
    duration: Float!
    optimizedDuration: Float!
    distance: Float!
    optimizedDistance: Float!
    stops: [Stop]!
    stopsCount: Int!
    cityId: ID!
  }

  type Query {
    route(id: ID!, language: Language): Route
    routes(cityId: ID!, textSearch: String, language: Language): [Route]
  }
`;
export default typeDefs;
