import gql from "graphql-tag";

const typeDefs = gql`
  type Media {
    id: ID
    place: Place
    title: String!
    text: String!
    rating: Float!
    audioUrl: String!
    voiceId: String!
    duration: Float
  }

  type Place {
    id: ID
    name: String!
    address: Address!
    description: String!
    importance: Int!
    rating: Float
    imagesUrl: [String]
    googleId: String
    googleMapsUri: String
    internationalPhoneNumber: String
    nationalPhoneNumber: String
    types: [String]
    primaryType: String
    userRatingCount: Float
    websiteUri: String
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
    route(id: ID!): Route
    routes(cityId: ID!, textSearch: String): [Route]
  }
`;
export default typeDefs;
