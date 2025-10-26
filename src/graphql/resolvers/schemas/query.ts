export default `
  type Query {
    hello: String
    getWorkspace(id: ID!): Workspace
    getAllWorkspaces: [Workspace!]!
    getProject(id: ID!): Project
    getAllProjects: [Project!]!
    getTask(id: ID!): Task
    getAllTasks(projectId: ID!): [Task!]!
  }
`;
