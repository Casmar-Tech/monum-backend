import { Types } from 'mongoose';
import { IStop, IStopTranslated } from './IStop.js';

export interface IRoute {
	_id?: Types.ObjectId;
	title: {
		[key: string]: string;
	};
	description: {
		[key: string]: string;
	};
	rating?: number;
	duration: number;
	optimizedDuration: number;
	distance: number;
	optimizedDistance: number;
	stops: IStop[];
	cityId: Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
}

export interface IRouteTranslated {
	_id?: Types.ObjectId;
	id?: Types.ObjectId;
	title: string;
	description: string;
	rating?: number;
	duration: number;
	optimizedDuration: number;
	distance: number;
	optimizedDistance: number;
	stops: IStopTranslated[];
	cityId: Types.ObjectId;
}
