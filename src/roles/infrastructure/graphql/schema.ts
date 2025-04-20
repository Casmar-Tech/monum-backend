import gql from "graphql-tag";

const typeDefs = gql`
  input RoleInput {
    name: String!
    description: String!
  }

  input CreateRoleInput {
    role: RoleInput!
    permissionsIds: [String!]!
  }

  type Role {
    id: ID!
    name: String!
    description: String!
    permissions: [Permission!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Mutation {
    createRole(createRoleInput: CreateRoleInput!): Role!
    addPermissionsToRole(roleId: ID!, permissionsIds: [String!]!): Role!
    removePermissionsFromRole(roleId: ID!, permissionsIds: [String!]!): Role!
  }
`;

export default typeDefs;
