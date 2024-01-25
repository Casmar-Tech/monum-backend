import { Types } from 'mongoose';
import {
	IPlace,
	IPlaceTranslated,
} from '../../places/domain/interfaces/IPlace.js';

export interface IMedia {
	_id?: Types.ObjectId;
	place: IPlace;
	title: {
		[key: string]: string;
	};
	text: {
		[key: string]: string;
	};
	rating: number;
	audioUrl: {
		[key: string]: string;
	};
	voiceId: {
		[key: string]: string;
	};
	duration: number;
	getSimplifiedVersion: (language: string) => IMediaTranslated;
}

export interface IMediaTranslated
	extends Omit<
		IMedia,
		'title' | 'text' | 'audioUrl' | 'voiceId' | 'getSimplifiedVersion' | 'place'
	> {
	title: string;
	text: string;
	audioUrl: string;
	voiceId: string;
	place: IPlaceTranslated;
}
