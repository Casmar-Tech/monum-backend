import { IMedia, IMediaTranslated } from '../../medias/domain/IMedia.js';

export interface IStop {
	order: number;
	optimizedOrder: number;
	media: IMedia;
}

export interface IStopTranslated {
	order: number;
	optimizedOrder: number;
	media: IMediaTranslated;
}
