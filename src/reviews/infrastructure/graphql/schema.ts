import gql from "graphql-tag";

const typeDefs = gql`
  enum EntityEnum {
    place
    route
    media
  }

  input ReviewInput {
    entityId: String!
    entityType: EntityEnum!
    rating: Float!
    comment: String
  }

  input GetReviewsInput {
    entityId: String
    entityType: EntityEnum
  }

  type Review {
    id: String!
    createdById: String!
    createdBy: User!
    entityId: String!
    entityType: EntityEnum!
    rating: Float!
    comment: String
  }

  type EntityReviews {
    rating: Float
    ratingCount: Int
    reviews: [Review]
  }

  type Mutation {
    createReview(review: ReviewInput): Review
  }

  type Query {
    reviews(query: GetReviewsInput): [Review]
  }
`;
export default typeDefs;
