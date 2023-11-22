import gql from "graphql-tag";

const typeDefs = gql`
  type Place {
    id: ID
    name: String!
    address: Address!
    description: String!
    importance: Int!
    rating: Float
    imagesUrl: [String]
  }

  type Media {
    id: ID
    place: Place
    title: String!
    text: String!
    language: String!
    rating: Float!
    audioUrl: String!
    voiceId: String!
    duration: Float
  }

  enum Language {
    en_US
    es_ES
    fr_FR
  }

  type Mutation {
    populateMediaByNumber(
      placeId: String!
      number: Int
      language: Language
    ): [Media]
    populateMediaByTopic(
      placeId: String!
      topic: String
      language: Language
    ): Media
    translateMedia(mediaId: ID!, outputLanguage: Language!): Media
    updateMedia(id: ID!, mediaUpdate: UpdateMediaInput!): Media
    deleteMedia(id: ID!): Media
  }

  type Query {
    media(id: ID!): Media
    medias(placeId: ID, language: Language): [Media]
  }

  input UpdateMediaInput {
    title: String
    text: String
    language: String
    rating: Float
    audioUrl: String
    voiceId: String
  }
`;
export default typeDefs;
