import { model, Schema, Types } from 'mongoose';
import { IMedia, IMediaTranslated } from '../../domain/IMedia.js';
import { PlaceSchema } from '../../../places/infrastructure/mongoModel/MongoPlaceModel.js';

export const MediaSchema = new Schema<IMedia>(
	{
		placeId: {
			type: Schema.Types.ObjectId,
			ref: 'places-news',
			required: true,
		},
		topicId: {
			type: Schema.Types.ObjectId,
			ref: 'media-topics',
			required: true,
		},
		title: {
			type: Object,
			of: String,
			required: true,
		},
		text: {
			type: Object,
			of: String,
			required: true,
		},
		rating: { type: Number, required: true },
		audioUrl: {
			type: Object,
			of: String,
			required: true,
		},
		voiceId: {
			type: Object,
			of: String,
			required: true,
		},
		duration: { type: Number },
	},
	{ timestamps: true },
);

MediaSchema.method(
	'getTranslatedVersion',
	function (language: string): IMediaTranslated {
		const getTranslation = (translations: { [key: string]: string }) => {
			// Try to get the translation for the language
			if (translations[language]) {
				return translations[language];
			}
			// If the translation for the language is not available, get the first one
			const anyTranslation = Object.values(translations)[0] || '';
			return anyTranslation;
		};

		return {
			...this.toObject(),
			id: this._id.toString(),
			title: getTranslation(this.title),
			text: getTranslation(this.text),
			audioUrl: getTranslation(this.audioUrl),
			voiceId: getTranslation(this.voiceId),
			place: this.place?.getTranslatedVersion(language),
		};
	},
);

export async function createMediaFromSimpleMedia(
	media: IMediaTranslated,
	language: string,
) {
	return await MongoMediaModel.create({
		title: {
			[language]: media.title,
		},
		text: {
			[language]: media.text,
		},
		rating: media.rating,
		audioUrl: {
			[language]: media.audioUrl,
		},
		voiceId: {
			[language]: media.voiceId,
		},
		duration: media.duration,
		placeId: media.placeId,
	});
}

export const MongoMediaModel = model('medias-news', MediaSchema);
