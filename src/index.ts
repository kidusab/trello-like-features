import express from "express";
import { ApolloServer } from "apollo-server-express";
import { typeDefs } from "./graphql/schema";
import { resolvers } from "./graphql/resolvers";
import { health } from "./routes/health";
import auth from "./routes/auth";

async function startServer() {
  const app = express();
  app.get("/health", health);

  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });
  await server.start();
  server.applyMiddleware({ app: app as any });

  app.use(express.json());
  app.use("/auth", auth);

  app.listen(4000, () => {
    console.log("🚀 Server ready at http://localhost:4000/graphql");
  });
}

startServer();
