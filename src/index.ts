import express from "express";
import { ApolloServer } from "apollo-server-express";
import { typeDefs } from "./graphql/schema";
import { resolvers } from "./graphql/resolvers";
import { health } from "./routes/health";
import auth from "./routes/auth";
import { verifyToken } from "./utils/token";
import { prisma } from "./prisma";

async function startServer() {
  const app = express();
  app.get("/health", health);

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({ req }) => {
      try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return { userId: null };

        const decoded = verifyToken<{ userId: string; type: "access" }>(token);
        if (!decoded) return { userId: null };

        if (decoded.type !== "access") return { userId: null };

        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
        });
        if (!user) return { userId: null };

        return { userId: user.id, user };
      } catch (error) {
        console.error("Error verifying token", error);
        return { userId: null };
      }
    },
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
