import gql from "graphql-tag";

const typeDefs = gql`
  type Media {
    id: ID!
    place: Place
    title: String!
    text: String
    rating: Float
    reviews: EntityReviews
    url: String
    voiceId: String
    duration: Float!
    type: MediaType!
    createdAt: Float
    updatedAt: Float
    placeId: ID!
    userReviewId: ID
  }

  type MediaFull {
    id: ID!
    place: PlaceFull
    title: [KeyValuePair!]!
    text: [KeyValuePair]
    rating: Float
    reviews: EntityReviews
    url: [KeyValuePair]
    voiceId: [KeyValuePair]
    duration: [KeyValuePair!]!
    type: MediaType!
    createdAt: Float
    updatedAt: Float
    placeId: ID!
    userReviewId: ID
  }

  input CreateMediaFullInput {
    placeId: ID!
    title: [KeyValuePairInput!]!
    text: [KeyValuePairInput]
    type: MediaType!
    videoBase64: [KeyValuePairInput]
    videoDurationInSeconds: [KeyFloatPairInput]
  }

  input UpdateMediaFullInput {
    placeId: ID!
    title: [KeyValuePairInput]
    text: [KeyValuePairInput]
    type: MediaType
    videoBase64: [KeyValuePairInput]
    videoDurationInSeconds: [KeyFloatPairInput]
    videosToDelete: [Language]
  }

  enum MediaType {
    audio
    video
    text
  }

  type Mutation {
    createMedia(
      placeId: ID!
      title: String!
      type: MediaType!
      rating: Float
      text: String
      videoBase64: String
      videoDurationInSeconds: Int
    ): Media
    createMediaFull(createMediaFull: CreateMediaFullInput!): MediaFull
    updateMedia(id: ID!, mediaUpdate: UpdateMediaInput!): Media
    updateMediaFull(id: ID!, updateMediaFull: UpdateMediaFullInput!): MediaFull
    translateMedia(mediaId: ID!, outputLanguage: Language!): Media
    deleteMedia(id: ID!): Boolean
  }

  type Query {
    media(id: ID!, language: Language): Media
    medias(placeId: ID, language: Language, textSearch: String): [Media]
    mediaFull(id: ID!): MediaFull
    mediasFull(placeId: ID, textSearch: String): [MediaFull]
  }

  input UpdateMediaInput {
    title: String
    text: String
    rating: Float
    url: String
    voiceId: String
  }
`;
export default typeDefs;
