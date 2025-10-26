export default `
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
`;
