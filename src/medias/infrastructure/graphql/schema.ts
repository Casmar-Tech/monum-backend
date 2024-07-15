import gql from "graphql-tag";

const typeDefs = gql`
  type Media {
    id: ID!
    place: Place
    title: String!
    text: String
    rating: Float
    url: String
    voiceId: String
    duration: Float!
    type: MediaType!
    createdAt: Float
    updatedAt: Float
    placeId: ID!
  }

  type MediaFull {
    id: ID!
    place: PlaceFull
    title: [KeyValuePair!]!
    text: [KeyValuePair]
    rating: Float
    url: [KeyValuePair]
    voiceId: [KeyValuePair]
    duration: [KeyValuePair!]!
    type: MediaType!
    createdAt: Float
    updatedAt: Float
    placeId: ID!
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
    translateMedia(mediaId: ID!, outputLanguage: Language!): Media
    updateMedia(id: ID!, mediaUpdate: UpdateMediaInput!): Media
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
