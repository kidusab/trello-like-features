import { gql } from "apollo-server-express";

export const typeDefs = gql`
  type Query {
    hello: String
    getWorkspace(id: ID!): Workspace
    getAllWorkspaces: [Workspace!]!
    getProject(id: ID!): Project
    getAllProjects: [Project!]!
    getTask(id: ID!): Task
    getAllTasks(projectId: ID!): [Task!]!
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

    # PROJECT
    createProject(workspaceId: ID!, name: String!): Project!
    updateProject(projectId: ID!, name: String!): Project!
    deleteProject(projectId: ID!): DeleteProjectResponse!
    addProjectMember(projectId: ID!, userEmail: String!): ProjectMember!
    removeProjectMember(
      projectId: ID!
      memberId: ID!
    ): RemoveProjectMemberResponse!
    updateProjectMemberRole(
      projectId: ID!
      memberId: ID!
      newRole: ProjectRole!
    ): UpdateProjectMemberRoleResponse!

    # TASK
    createTask(
      projectId: ID!
      title: String!
      description: String
      assigneeId: ID
      dueDate: String
      status: TaskStatus
    ): Task!
    updateTask(
      taskId: ID!
      title: String
      description: String
      assigneeId: ID
      dueDate: String
      status: TaskStatus
    ): Task!
    deleteTask(taskId: ID!): DeleteTaskResponse!
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
