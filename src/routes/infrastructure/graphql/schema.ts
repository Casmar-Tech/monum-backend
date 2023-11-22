import gql from "graphql-tag";

const typeDefs = gql`
  type Media {
    id: ID!
    place: Place!
    title: String!
    text: String!
    language: String!
    rating: Float!
    audioUrl: String!
    voiceId: String!
  }

  type Place {
    id: ID!
    name: String!
    address: Address!
    description: String!
    importance: Int!
    rating: Float!
    imagesUrl: [String]!
  }

  type Stop {
    media: Media!
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
    language: String!
  }

  type Mutation {
    populateRoutes(
      place: String! # Normally will be the city, zone or neighborhood
      topic: String!
      stops: Int # The number of stops of the route (3 if not specified)
      number: Int
    ): [Route]
    addExistingMediaToRoute(id: String!, mediaId: String!): Route
  }

  type Query {
    route(id: ID!): Route
    routes(cityId: ID!, language: String, textSearch: String): [Route]
  }
`;
export default typeDefs;
