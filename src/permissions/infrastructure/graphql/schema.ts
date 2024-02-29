import gql from "graphql-tag";

const typeDefs = gql`
  input PermissionInput {
    name: String!
    description: String!
    action: String!
    entity: String!
    max: Int
    min: Int
  }

  input CreatePermissionInput {
    permission: PermissionInput!
  }

  type Permission {
    id: ID
    name: String!
    description: String!
    action: String!
    entity: String!
    max: Int
    min: Int
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Mutation {
    createPermission(createPermissionInput: CreatePermissionInput!): Permission!
  }
`;

export default typeDefs;
