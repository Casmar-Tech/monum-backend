import gql from "graphql-tag";

const typeDefs = gql`
  type KeyValuePair {
    key: String!
    value: String!
  }

  type Stop {
    place: Place!
    medias: [Media]!
    order: Int!
    optimizedOrder: Int!
  }

  type StopFull {
    place: PlaceFull!
    medias: [MediaFull]!
    order: Int!
    optimizedOrder: Int!
  }

  type Route {
    id: ID!
    title: String!
    description: String!
    rating: Float
    duration: Float
    optimizedDuration: Float
    distance: Float
    optimizedDistance: Float
    stops: [Stop]!
    stopsCount: Int!
    cityId: ID!
    createdAt: Float!
    updatedAt: Float!
  }

  type RouteFull {
    id: ID!
    title: [KeyValuePair!]!
    description: [KeyValuePair!]!
    duration: Float
    optimizedDuration: Float
    distance: Float
    optimizedDistance: Float
    stops: [StopFull]!
    stopsCount: Int!
    cityId: ID!
    createdAt: Float!
    updatedAt: Float!
  }

  type RoutesFullPaginated {
    routes: [RouteFull]!
    total: Int!
  }

  type RoutesPaginated {
    routes: [Route]!
    total: Int!
  }

  input StopInput {
    placeId: ID!
    mediasIds: [ID]!
    order: Int!
    optimizedOrder: Int
  }

  input KeyValuePairInput {
    key: String!
    value: String!
  }

  input KeyFloatPairInput {
    key: String!
    value: Float!
  }

  input CreateRouteFullInput {
    title: [KeyValuePairInput!]!
    description: [KeyValuePairInput!]!
    cityId: ID
    stops: [StopInput]!
  }

  input UpdateRouteFullInput {
    title: [KeyValuePairInput!]!
    description: [KeyValuePairInput!]!
    cityId: ID
    stops: [StopInput]
  }

  type Query {
    route(id: ID!, language: Language): Route
    routeFull(id: ID!): RouteFull
    routes(cityId: ID!, textSearch: String): [Route]
    routesPaginated(
      cityId: ID
      textSearch: String
      limit: Int
      offset: Int
      language: Language
    ): RoutesPaginated
    routesFullPaginated(
      cityId: ID
      textSearch: String
      limit: Int
      offset: Int
    ): RoutesFullPaginated
  }

  type Mutation {
    createRouteFull(routeFull: CreateRouteFullInput!): RouteFull
    updateRouteFull(id: ID!, routeUpdateFull: UpdateRouteFullInput!): RouteFull
    deleteRoute(id: ID!): Boolean
  }
`;
export default typeDefs;
