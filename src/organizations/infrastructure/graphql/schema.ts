import gql from "graphql-tag";

const typeDefs = gql`
  input CoordinatesInput {
    lng: Float!
    lat: Float!
  }

  input AddressInput {
    street: String!
    city: String!
    postalCode: String!
    province: String!
    country: String!
    coordinates: CoordinatesInput!
  }

  input ContactInput {
    name: String!
    email: String!
    phoneNumber: String!
  }

  input CreateOrganizationInput {
    organization: OrganizationInput!
    planId: String!
  }

  enum Language {
    en_US
    es_ES
    fr_FR
    ca_ES
  }

  input OrganizationInput {
    name: String!
    description: String!
    address: AddressInput!
    contacts: [ContactInput!]!
    availableLanguages: [Language!]!
    defaultLanguage: Language!
  }

  type Contact {
    name: String!
    email: String!
    phoneNumber: String!
  }

  type Address {
    street: String!
    city: String!
    postalCode: String!
    province: String!
    country: String!
  }

  type Organization {
    id: ID!
    name: String!
    description: String!
    address: Address!
    contacts: [Contact!]!
    plan: Plan!
    createdAt: DateTime!
    updatedAt: DateTime!
    availableLanguages: [Language!]!
    defaultLanguage: Language!
  }

  type Mutation {
    createOrganization(
      createOrganizationInput: CreateOrganizationInput!
    ): Organization!
  }
`;

export default typeDefs;
