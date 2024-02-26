import gql from "graphql-tag";

const typeDefs = gql`
  input PlanInput {
    name: String!
    description: String!
    price: Float!
  }

  input CreatePlanInput {
    plan: PlanInput!
    permissionsIds: [String!]!
  }

  type Plan {
    id: ID!
    name: String!
    description: String!
    price: Float!
    permissions: [Permission!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Mutation {
    createPlan(createPlanInput: CreatePlanInput!): Plan!
  }
`;

export default typeDefs;
