import gql from "graphql-tag";
const typeDefs = gql`
  enum SortField {
    rating
    importance
    name
  }
  enum SortOrder {
    asc
    desc
  }

  type Coordinates {
    lat: Float!
    lng: Float!
  }

  type Address {
    coordinates: Coordinates!
    street: String
    city: String!
    postalCode: String
    province: String
    country: String!
  }

  type Photo {
    id: String!
    url: String!
    width: Int!
    height: Int!
  }

  type Place {
    id: ID
    name: String!
    address: Address!
    description: String!
    importance: Int!
    rating: Float
    imagesUrl: [String]
  }

  type Query {
    place(id: ID!): Place
    places(
      textSearch: String
      centerCoordinates: [Float]
      sortField: SortField
      sortOrder: SortOrder
    ): [Place]
    placeSearcherSuggestions(textSearch: String!): [String]
  }

  type Mutation {
    populatePlaceByZone(zone: String!, number: Int): [Place]
    populatePlaceByName(name: String!, addMedia: Boolean): Place
    updatePlace(id: ID!, placeUpdate: UpdatePlaceInput!): Place
    deletePlace(id: ID!): Place
  }

  input CoordinatesInput {
    lat: Float!
    lng: Float!
  }

  input AddressInput {
    coordinates: CoordinatesInput!
    street: String
    city: String!
    postalCode: String
    province: String
    country: String!
  }

  input UpdatePlaceInput {
    name: String
    address: AddressInput
    description: String
    importance: Int
    rating: Float
  }
`;
export default typeDefs;
