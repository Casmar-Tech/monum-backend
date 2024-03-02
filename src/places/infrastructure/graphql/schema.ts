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

  enum ImageSize {
    small
    medium
    large
    original
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

  type Query {
    place(id: ID!, imageSize: ImageSize, language: Language): Place
    places(
      textSearch: String
      centerCoordinates: [Float]
      sortField: SortField
      sortOrder: SortOrder
      imageSize: ImageSize
      language: Language
    ): [Place]
    placeSearcherSuggestions(textSearch: String!): [String]
    getOrganizationIdOfAPlace(placeId: ID!): ID
  }

  type Mutation {
    updatePlace(id: ID!, placeUpdate: UpdatePlaceInput!): Place
    deletePlace(id: ID!): Boolean
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
