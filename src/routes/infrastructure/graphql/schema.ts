import gql from "graphql-tag";

const typeDefs = gql`
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
