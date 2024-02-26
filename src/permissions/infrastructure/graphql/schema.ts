import gql from "graphql-tag";

const typeDefs = gql`
  input PermissionInput {
    name: String!
    description: String!
    action: String!
    entity: String!
    max: Int
    min: Int
    allowed: Boolean!
  }

  input CreatePermissionInput {
    permission: PermissionInput!
  }

  type Permission {
    id: ID!
    name: String!
    description: String!
    action: String!
    entity: String!
    max: Int
    min: Int
    allowed: Boolean
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Mutation {
    createPermission(CreatePermissionInput: CreatePermissionInput!): Permission!
  }
`;

export default typeDefs;
