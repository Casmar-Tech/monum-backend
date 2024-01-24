import { Types } from 'mongoose';

export default interface IPhoto {
	_id?: Types.ObjectId;
	url: string;
	width: number;
	height: number;
	sizes: {
		[key: string]: string;
	};
}
