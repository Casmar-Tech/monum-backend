import gql from "graphql-tag";

const typeDefs = gql`
  input CoordinatesInput {
    lng: Float!
    lat: Float!
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

  type OrganizationFull {
    id: ID!
    name: String!
    description: String!
    address: AddressFull!
    contacts: [Contact!]!
    plan: Plan!
    createdAt: DateTime!
    updatedAt: DateTime!
    availableLanguages: [Language!]!
    defaultLanguage: Language!
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
  type Query {
    organization(id: ID!, language: Language): Organization!
    organizationFull(id: ID!): OrganizationFull!
  }
`;

export default typeDefs;
