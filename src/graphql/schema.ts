import { gql } from "apollo-server-express";

export const typeDefs = gql`
  type Query {
    hello: String
  }

  type Mutation {
    register(email: String!, password: String!): AuthPayload!
    forgotPassword(email: String!): ForgotPasswordResponse!
    updatePassword(
      currentPassword: String!
      newPassword: String!
    ): UpdatePasswordResponse!
  }

  type AuthPayload {
    accessToken: String!
    refreshToken: String!
    user: User!
  }

  type ForgotPasswordResponse {
    success: Boolean!
    message: String
  }

  type UpdatePasswordResponse {
    success: Boolean!
    message: String
  }

  type User {
    id: ID!
    email: String!
    createdAt: String!
    updatedAt: String!
  }
`;
