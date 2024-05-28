import gql from "graphql-tag";

const typeDefs = gql`
  scalar DateTime

  input RegisterInput {
    username: String
    name: String
    email: String!
    password: String!
    language: String
    roleId: String
    organizationId: String
  }

  input LoginInput {
    emailOrUsername: String!
    password: String!
  }

  input LoginGoogleInput {
    email: String!
    googleId: String!
    name: String
    photo: String
    language: String
  }

  input UpdateUserInput {
    id: String!
    username: String
    name: String
    photoBase64: String
    language: String
    email: String
  }

  input ResetPasswordInput {
    email: String!
    resend: Boolean
  }

  input VerificateCodeInput {
    email: String!
    code: String!
  }

  input UpdatePasswordWithoutOldInput {
    newPassword: String!
    token: String!
  }

  type UserFull {
    id: ID!
    email: String!
    username: String
    name: String
    createdAt: DateTime!
    updatedAt: DateTime!
    googleId: String
    token: String
    language: String
    photo: String
    hasPassword: Boolean
    roleId: String!
    organization: OrganizationFull
    permissions: [Permission!]
    deviceId: String
  }

  type User {
    id: ID!
    email: String!
    username: String
    name: String
    createdAt: DateTime!
    updatedAt: DateTime!
    googleId: String
    token: String
    language: String
    photo: String
    hasPassword: Boolean
    roleId: String!
    organization: Organization
    permissions: [Permission!]
    deviceId: String
  }

  type Mutation {
    registerUser(registerInput: RegisterInput!): User
    loginUser(loginInput: LoginInput!): User
    loginGoogleUser(loginGoogleInput: LoginGoogleInput!): User
    updateUser(updateUserInput: UpdateUserInput!): User
    updatePassword(oldPassword: String!, newPassword: String!): Boolean
    resetPassword(resetPasswordInput: ResetPasswordInput!): Boolean
    verificateCode(verificateCodeInput: VerificateCodeInput!): String
    updatePasswordWithoutOld(
      updatePasswordWithoutOldInput: UpdatePasswordWithoutOldInput!
    ): String
    createNonExpiringToken(loginInput: LoginInput!): User
    loginUserAsGuest(deviceId: String!, language: String!): User
    deleteHardMyUser: Boolean
  }

  type Query {
    user: User
    userFull: UserFull
    users: [User]
  }
`;
export default typeDefs;
