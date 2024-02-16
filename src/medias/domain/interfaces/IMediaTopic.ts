import { Types } from 'mongoose';

export interface IMediaTopic {
	_id?: Types.ObjectId;
	topic: string;
	createdAt: Date;
	updatedAt: Date;
}
