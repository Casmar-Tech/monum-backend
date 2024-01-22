import { IMedia, IMediaSimplified } from '../../medias/domain/IMedia.js';

export interface IStop {
	order: number;
	optimizedOrder: number;
	media: IMedia;
}

export interface IStopSimplified {
	order: number;
	optimizedOrder: number;
	media: IMediaSimplified;
}
