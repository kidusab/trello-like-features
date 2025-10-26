import { gql } from "apollo-server-express";

export const typeDefs = gql`
  type Query {
    hello: String
    getWorkspace(id: ID!): Workspace
    getAllWorkspaces: [Workspace!]!
  }

  type Mutation {
    # AUTH USER
    register(email: String!, password: String!): AuthPayload!
    forgotPassword(email: String!): ForgotPasswordResponse!
    updatePassword(
      currentPassword: String!
      newPassword: String!
    ): UpdatePasswordResponse!

    # WORKSPACE
    createWorkspace(name: String!): Workspace!
    addWorkspaceMember(workspaceId: ID!, userEmail: String!): WorkspaceMember!
    removeWorkspaceMember(
      workspaceId: ID!
      memberId: ID!
    ): RemoveMemberResponse!
    updateWorkspaceMemberRole(
      workspaceId: ID!
      memberId: ID!
      newRole: WorkspaceRole!
    ): UpdateMemberRoleResponse!
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

  """
  Workspace entity containing members list.
  """
  type Workspace {
    id: ID!
    name: String!
    createdAt: String!
    updatedAt: String!
    members: [WorkspaceMember!]!
  }

  """
  A user and their role in a workspace.
  """
  type WorkspaceMember {
    id: ID!
    user: User!
    role: WorkspaceRole!
    joinedAt: String!
  }

  enum WorkspaceRole {
    OWNER
    MEMBER
    VIEWER
    ADMIN
  }

  type RemoveMemberResponse {
    success: Boolean!
    message: String
  }

  type UpdateMemberRoleResponse {
    success: Boolean!
    message: String
    previousRole: WorkspaceRole
    newRole: WorkspaceRole
  }
`;
