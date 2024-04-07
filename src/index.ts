import dotenv from "dotenv";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { mergeResolvers, mergeTypeDefs } from "@graphql-tools/merge";
import "./connection.js";
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

const server = new ApolloServer<MyContext>({
  typeDefs,
  resolvers,
});

const { url } = await startStandaloneServer(server, {
  context: async ({ req }) => ({
    token: req.headers.authorization || "",
  }),
  listen: { port: Number(process.env.PORT) || 4000 },
});

console.log(`🚀  Server ready at: ${url}`);
