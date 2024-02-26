import gql from "graphql-tag";

const typeDefs = gql`
  input AddressInput {
    street: String!
    city: String!
    postalCode: String!
    province: String!
    country: String!
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
  }

  type Mutation {
    createOrganization(
      createOrganizationInput: CreateOrganizationInput!
    ): Organization!
  }
`;

export default typeDefs;
