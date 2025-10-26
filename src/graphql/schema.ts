import { gql } from "apollo-server-express";
import querySchemas from "./resolvers/schemas/query";
import authMutationsSchemas from "./resolvers/schemas/auth";
import workspaceMutationsSchemas from "./resolvers/schemas/workspace";
import projectMutationsSchemas from "./resolvers/schemas/project";
import taskMutationsSchemas from "./resolvers/schemas/task";

export const typeDefs = gql`
  ${querySchemas}

  type Mutation {
    ${authMutationsSchemas}

    ${workspaceMutationsSchemas}

    ${projectMutationsSchemas}

    ${taskMutationsSchemas}
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

  type Workspace {
    id: ID!
    name: String!
    createdAt: String!
    updatedAt: String!
    members: [WorkspaceMember!]!
  }

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

  type Project {
    id: ID!
    name: String!
    createdAt: String!
    updatedAt: String!
    members: [ProjectMember!]!
    tasks: [Task!]!
  }

  type ProjectMember {
    id: ID!
    user: User!
    role: ProjectRole!
    joinedAt: String!
  }

  enum ProjectRole {
    PROJECT_LEAD
    CONTRIBUTOR
    PROJECT_VIEWER
  }

  type DeleteProjectResponse {
    success: Boolean!
    message: String
  }

  type RemoveProjectMemberResponse {
    success: Boolean!
    message: String
  }

  type UpdateProjectMemberRoleResponse {
    success: Boolean!
    message: String
    previousRole: ProjectRole
    newRole: ProjectRole
  }

  # TASK TYPES

  type Task {
    id: ID!
    project: Project!
    title: String!
    description: String
    status: TaskStatus!
    assignee: User
    dueDate: String
    createdAt: String!
    updatedAt: String!
  }

  enum TaskStatus {
    TODO
    IN_PROGRESS
    DONE
    BLOCKED
  }

  type DeleteTaskResponse {
    success: Boolean!
    message: String
  }
`;
