import { model, Schema } from 'mongoose';
import { IMediaTopic } from '../../domain/IMediaTopic.js';

export const MediaTopicSchema = new Schema<IMediaTopic>({
	topic: { type: String, required: true },
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now },
});

export const MongoMediaTopicModel = model('media-topics', MediaTopicSchema);
