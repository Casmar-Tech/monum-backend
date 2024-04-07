import gql from "graphql-tag";
const typeDefs = gql`
  enum SortField {
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
    imagesUrl: [String]
    createdBy: User
  }

  type PageInfo {
    totalPages: Int
    currentPage: Int
    totalResults: Int
  }

  type PlaceSearchResults {
    places: [Place]
    pageInfo: PageInfo
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
    getPlaceBySearchAndPagination(
      textSearch: String!
      pageNumber: Int!
      resultsPerPage: Int!
    ): PlaceSearchResults
  }

  type Mutation {
    createPlace(place: CreatePlaceInput!): Place
    updatePlace(id: ID!, placeUpdate: UpdatePlaceInput!): Place
    deletePlace(id: ID!): Boolean
  }

  input NameTranslationsInput {
    en_US: String
    es_ES: String
    fr_FR: String
    ca_ES: String
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
  }

  input CreatePlaceInput {
    name: String!
    address: AddressInput!
    description: String!
    importance: Int!
  }
`;
export default typeDefs;
