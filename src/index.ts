import dotenv from "dotenv";
import { mergeResolvers, mergeTypeDefs } from "@graphql-tools/merge";
import "./connection.js";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import express from "express";
import http from "http";
import cors from "cors";
import usersTypeDefs from "./users/infrastructure/graphql/schema.js";
import usersResolvers from "./users/infrastructure/graphql/resolvers.js";
import mediasTypeDefs from "./medias/infrastructure/graphql/schema.js";
import mediasResolvers from "./medias/infrastructure/graphql/resolvers.js";
import routesTypeDefs from "./routes/infrastructure/graphql/schema.js";
import routesResolvers from "./routes/infrastructure/graphql/resolvers.js";
import placesTypeDefs from "./places/infrastructure/graphql/schema.js";
import placesResolvers from "./places/infrastructure/graphql/resolvers.js";
import citiesTypeDefs from "./cities/infrastructure/graphql/schema.js";
import citiesResolvers from "./cities/infrastructure/graphql/resolvers.js";
import permissionsTypeDefs from "./permissions/infrastructure/graphql/schema.js";
import permissionsResolvers from "./permissions/infrastructure/graphql/resolvers.js";
import plansTypeDefs from "./plans/infrastructure/graphql/schema.js";
import plansResolvers from "./plans/infrastructure/graphql/resolvers.js";
import organizationsTypeDefs from "./organizations/infrastructure/graphql/schema.js";
import organizationsResolvers from "./organizations/infrastructure/graphql/resolvers.js";
import rolesTypeDefs from "./roles/infrastructure/graphql/schema.js";
import rolesResolvers from "./roles/infrastructure/graphql/resolvers.js";
import searcherTypeDefs from "./searcher/infrastructure/graphql/schema.js";
import searcherResolvers from "./searcher/infrastructure/graphql/resolvers.js";
import bodyParser from "body-parser";

dotenv.config();

const typeDefs = mergeTypeDefs([
  usersTypeDefs,
  mediasTypeDefs,
  routesTypeDefs,
  placesTypeDefs,
  citiesTypeDefs,
  permissionsTypeDefs,
  plansTypeDefs,
  organizationsTypeDefs,
  rolesTypeDefs,
  searcherTypeDefs,
]);
const resolvers = mergeResolvers([
  usersResolvers,
  mediasResolvers,
  routesResolvers,
  placesResolvers,
  citiesResolvers,
  permissionsResolvers,
  plansResolvers,
  organizationsResolvers,
  rolesResolvers,
  searcherResolvers,
]);

interface MyContext {
  token: string;
}

// Required logic for integrating with Express
const app = express();
// Our httpServer handles incoming requests to our Express app.
// Below, we tell Apollo Server to "drain" this httpServer,
// enabling our servers to shut down gracefully.
const httpServer = http.createServer(app);

// Same ApolloServer initialization as before, plus the drain plugin
// for our httpServer.
const server = new ApolloServer<MyContext>({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});
// Ensure we wait for our server to start
await server.start();

// Set up our Express middleware to handle CORS, body parsing,
// and our expressMiddleware function.
app.use(
  "/",
  cors<cors.CorsRequest>(),
  // 50mb is the limit that `startStandaloneServer` uses, but you may configure this to suit your needs
  bodyParser.json({ limit: "1gb" }),
  // expressMiddleware accepts the same arguments:
  // an Apollo Server instance and optional configuration options
  expressMiddleware(server, {
    context: async ({ req }) => ({
      token: req.headers.authorization || "",
    }),
  })
);

// Modified server startup
const port = process.env.PORT || 4001;
await new Promise<void>((resolve) =>
  httpServer.listen({ port: port }, resolve)
);
console.log(`🚀 Server ready at http://localhost:4000/`);
