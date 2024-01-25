import { model, Schema } from 'mongoose';
import { IMedia, IMediaTranslated } from '../../domain/IMedia.js';
import {
	createPlaceFromTranslatedPlace,
	PlaceSchema,
} from '../../../places/infrastructure/mongoModel/MongoPlaceModel.js';

export const MediaSchema = new Schema<IMedia>({
	place: { type: PlaceSchema, required: true },
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
});

MediaSchema.method(
	'getSimplifiedVersion',
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
			_id: this.id,
			place: this.place.getTranslatedVersion(language),
			title: getTranslation(this.title),
			text: getTranslation(this.text),
			rating: this.rating,
			audioUrl: getTranslation(this.audioUrl),
			voiceId: getTranslation(this.voiceId),
			duration: this.duration,
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
		place: await createPlaceFromTranslatedPlace(media.place, language),
	});
}

export const MongoMediaModel = model('medias-news', MediaSchema);
