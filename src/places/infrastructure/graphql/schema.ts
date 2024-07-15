import gql from "graphql-tag";
const typeDefs = gql`
  enum FromSupport {
    outsideQRAppRunning
    outsideQRAppClosed
    insideQRScanned
    insideQRTexted
    mapTextSearch
    map
  }

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

  type AddressFull {
    coordinates: Coordinates!
    street: [KeyValuePair]
    city: [KeyValuePair!]!
    postalCode: String
    province: [KeyValuePair]
    country: [KeyValuePair!]!
  }

  type PlacePhotoSizes {
    small: String!
    medium: String!
    large: String!
    original: String!
  }

  type PlacePhoto {
    url: String!
    sizes: PlacePhotoSizes!
    createdBy: User
    order: Int!
    createdAt: Float
    updatedAt: Float
    id: ID!
    name: String
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
    photos: [PlacePhoto!]!
    createdBy: User
    createdAt: Float
    updatedAt: Float
  }

  type PlaceFull {
    id: ID
    name: String!
    nameTranslations: [KeyValuePair!]!
    address: AddressFull!
    description: [KeyValuePair!]!
    importance: Int!
    imagesUrl: [String]
    photos: [PlacePhoto!]!
    createdBy: UserFull
    createdAt: Float
    updatedAt: Float
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

  input OldPhotosUpdateInput {
    id: String
    order: Int
  }

  input NewPhotosUpdateInput {
    photoBase64: String
    order: Int
    name: String
  }

  input NameTranslationsInput {
    en_US: String
    es_ES: String
    fr_FR: String
    ca_ES: String
  }

  input AddressInput {
    street: String!
    city: String!
    postalCode: String!
    province: String!
    country: String!
    coordinates: CoordinatesInput!
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

  type Query {
    place(
      id: ID!
      imageSize: ImageSize
      language: Language
      isMobile: Boolean
      fromSupport: FromSupport
    ): Place
    placeFull(
      id: ID!
      imageSize: ImageSize
      isMobile: Boolean
      fromSupport: FromSupport
    ): PlaceFull
    places(
      textSearch: String
      centerCoordinates: [Float]
      sortField: SortField
      sortOrder: SortOrder
      imageSize: ImageSize
      language: Language
    ): [Place]
    placesFull(textSearch: String): [PlaceFull]
    getPlaceBySearchAndPagination(
      textSearch: String!
      pageNumber: Int!
      resultsPerPage: Int!
    ): PlaceSearchResults
  }

  type Mutation {
    createPlace(place: CreatePlaceInput!): Place
    updatePlace(id: ID!, placeUpdate: UpdatePlaceInput!): Place
    updatePlacePhotos(
      id: ID!
      oldPhotos: [OldPhotosUpdateInput!]!
      newPhotos: [NewPhotosUpdateInput]
    ): Boolean
    deletePlace(id: ID!): Boolean
  }
`;
export default typeDefs;
