import GetRouteByIdUseCase from "../../application/GetRouteByIdUseCase.js";
import GetRoutesByFiltersUseCase from "../../application/GetRoutesByFiltersUseCase.js";
import GetRoutesFullByFiltersPaginated from "../../application/GetRoutesFullByFiltersPaginated.js";
import GetRoutesByFiltersPaginated from "../../application/GetRoutesByFiltersPaginated.js";
import DeleteRoute from "../../application/DeleteRoute.js";
import CreateRouteFull from "../../application/CreateRouteFull.js";
import UpdateRouteFull from "../../application/UpdateRouteFull.js";
import { checkToken } from "../../../middleware/auth.js";
import { IRoute, IRouteTranslated } from "../../domain/interfaces/IRoute.js";
import { ApolloError } from "apollo-server-errors";
import { MongoRouteModel } from "../mongoModel/MongoRouteModel.js";
import { Languages } from "../../../shared/Types.js";
import { MongoCityModel } from "../../../cities/infrastructure/mongoModel/MongoCityModel.js";

export interface StopInput {
  placeId: string;
  mediasIds: string[];
  order: number;
  optimizedOrder: number;
}
export interface RouteFullInput {
  title: {
    key: string;
    value: string;
  }[];
  description: {
    key: string;
    value: string;
  }[];
  cityId?: string;
  stops: StopInput[];
}

const resolvers = {
  Stop: {
    order: (parent: any) => parent.order || 0,
    optimizedOrder: (parent: any) => parent.optimizedOrder || parent.order,
  },
  StopFull: {
    order: (parent: any) => parent.order || 0,
    optimizedOrder: (parent: any) => parent.optimizedOrder || parent.order,
  },
  Route: {
    id: (parent: IRouteTranslated) => parent._id?.toString(),
    stopsCount: (parent: IRouteTranslated) => parent.stops.length,
    optimizedDuration: (parent: IRouteTranslated) =>
      parent.optimizedDuration || parent.duration,
    optimizedDistance: (parent: IRouteTranslated) =>
      parent.optimizedDistance || parent.distance,
    city: async (parent: IRouteTranslated) => {
      const city = await MongoCityModel.findById(parent.cityId)
        .select("name")
        .lean();
      return city;
    },
  },
  RouteFull: {
    id: (parent: IRoute) => parent._id?.toString(),
    stopsCount: (parent: IRoute) => parent.stops.length,
    description: (parent: IRoute) => {
      return Object.entries(parent.description).map(([key, value]) => {
        return { key, value };
      });
    },
    title: (parent: IRoute) => {
      return Object.entries(parent.title).map(([key, value]) => {
        return { key, value };
      });
    },
    optimizedDuration: (parent: IRoute) =>
      parent.optimizedDuration || parent.duration,
    optimizedDistance: (parent: IRoute) =>
      parent.optimizedDistance || parent.distance,
    city: async (parent: IRoute) => {
      const city = await MongoCityModel.findById(parent.cityId)
        .select("name")
        .lean();
      return city;
    },
  },

  Query: {
    route: async (
      parent: any,
      args: { id: string },
      { token }: { token: string }
    ) => {
      const { id: userId } = checkToken(token);
      if (!userId) throw new ApolloError("User not found", "USER_NOT_FOUND");
      const route = await GetRouteByIdUseCase(userId, args.id);
      return route;
    },
    routeFull: async (
      parent: any,
      args: { id: string },
      { token }: { token: string }
    ) => {
      checkToken(token);
      const route = await MongoRouteModel.findById(args.id);
      if (!route) throw new ApolloError("Route not found", "ROUTE_NOT_FOUND");
      return route.toObject();
    },
    routes: async (
      parent: any,
      args: { cityId: string; textSearch: string },
      { token }: { token: string }
    ) => {
      const { id: userId } = checkToken(token);
      if (!userId) throw new ApolloError("User not found", "USER_NOT_FOUND");
      const routes = await GetRoutesByFiltersUseCase(
        userId,
        args.cityId,
        args.textSearch
      );
      return routes;
    },
    routesPaginated: async (
      parent: any,
      args: {
        cityId: string;
        textSearch: string;
        limit: number;
        offset: number;
        language: Languages;
      },
      { token }: { token: string }
    ) => {
      const { id: userId } = checkToken(token);
      if (!userId) throw new ApolloError("User not found", "USER_NOT_FOUND");
      const { routes, total } = await GetRoutesByFiltersPaginated(
        userId,
        args.cityId,
        args.textSearch,
        args.limit,
        args.offset,
        args.language
      );
      return { routes, total };
    },
    routesFullPaginated: async (
      parent: any,
      args: {
        cityId: string;
        textSearch: string;
        limit: number;
        offset: number;
      },
      { token }: { token: string }
    ) => {
      checkToken(token);
      const { routes, total } = await GetRoutesFullByFiltersPaginated(
        args.cityId,
        args.textSearch,
        args.limit,
        args.offset
      );
      return { routes, total };
    },
  },

  Mutation: {
    createRouteFull: async (
      parent: any,
      args: { routeFull: RouteFullInput },
      { token }: { token: string }
    ) => {
      const { id: userId } = checkToken(token);
      if (!userId) throw new ApolloError("User not found", "USER_NOT_FOUND");
      const route = await CreateRouteFull(userId, args.routeFull);
      return route;
    },
    updateRouteFull: async (
      parent: any,
      args: { id: string; routeUpdateFull: Partial<RouteFullInput> },
      { token }: { token: string }
    ) => {
      const { id: userId } = checkToken(token);
      if (!userId) throw new ApolloError("User not found", "USER_NOT_FOUND");
      const route = await UpdateRouteFull(args.id, args.routeUpdateFull);
      return route;
    },
    deleteRoute: (
      parent: any,
      args: { id: string },
      { token }: { token: string }
    ) => {
      checkToken(token);
      return DeleteRoute(args.id);
    },
  },
};

export default resolvers;
