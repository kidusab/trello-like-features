export default `
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
`;
