import PopulateRoutesUseCase from '../../application/PopulateRoutesUseCase.js';
import GetRouteByIdUseCase from '../../application/GetRouteByIdUseCase.js';
import GetRoutesByFiltersUseCase from '../../application/GetRoutesByFiltersUseCase.js';
import { checkToken } from '../../../middleware/auth.js';
import { IRoute } from '../../domain/IRoute.js';
import { ApolloError } from 'apollo-server-errors';

const resolvers = {
	Route: {
		stopsCount: (parent: IRoute) => parent.stops.length,
	},
	Mutation: {
		populateRoutes: async (
			parent: any,
			args: { place: string; topic: string; stops?: number; number?: number },
			{ token }: { token: string },
		) => {
			checkToken(token);
			return PopulateRoutesUseCase({
				place: args.place,
				topic: args.topic,
				stops: args.stops,
				number: args.number,
			});
		},
	},

	Query: {
		route: async (
			parent: any,
			args: { id: string },
			{ token }: { token: string },
		) => {
			const { id: userId } = checkToken(token);
			if (!userId) throw new ApolloError('User not found', 'USER_NOT_FOUND');
			const route = await GetRouteByIdUseCase(userId, args.id);
			return route;
		},
		routes: async (
			parent: any,
			args: { cityId: string; language: string; textSearch: string },
			{ token }: { token: string },
		) => {
			checkToken(token);
			const routes = await GetRoutesByFiltersUseCase(
				args.cityId,
				args.language || 'en_US',
				args.textSearch,
			);
			return routes;
		},
	},
};

export default resolvers;
