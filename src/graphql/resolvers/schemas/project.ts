export default `
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
`;
