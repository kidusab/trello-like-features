import Query from "./resolvers/query";
import Auth from "./resolvers/mutations/auth";
import Workspace from "./resolvers/mutations/workspace";
import Project from "./resolvers/mutations/project";
import Task from "./resolvers/mutations/task";

export const resolvers = {
  Query: { ...Query },

  Mutation: {
    ...Auth,
    ...Workspace,
    ...Project,
    ...Task,
  }, // end Mutation
};
