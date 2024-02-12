import '../../connection.js';
import { MongoPlaceModel } from '../infrastructure/mongoModel/MongoPlaceModel';
import deepl, {
	TargetLanguageCode as TargetLanguageCodeDeepl,
} from 'deepl-node';
import { Languages } from '../../shared/Types';

async function TranslatePlace(placeId: string, outputLanguage: Languages) {
	let outputLanguageDeepl: TargetLanguageCodeDeepl;
	switch (outputLanguage) {
		case 'fr_FR':
			outputLanguageDeepl = 'fr';
			break;
		case 'en_US':
			outputLanguageDeepl = 'en-US';
			break;
		case 'es_ES':
			outputLanguageDeepl = 'es';
			break;
		default:
			outputLanguageDeepl = 'en-US';
			break;
	}
	let place = await MongoPlaceModel.findById(placeId);
	if (!place) {
		throw new Error('Place not found');
	}
	try {
		const translator = new deepl.Translator(process.env.DEEPL_AUTH_KEY!);
		const translateString = async (text?: string): Promise<string> => {
			try {
				return text
					? (await translator.translateText(text, null, outputLanguageDeepl))
							.text
					: '';
			} catch (error) {
				console.error(error);
				return text || '';
			}
		};

		if (!place.nameTranslations[outputLanguage]) {
			const translatedName = await translateString(place.name);
			place.nameTranslations = {
				...place.nameTranslations,
				[outputLanguage]: translatedName,
			};
		}

		if (place.description && !place.description[outputLanguage]) {
			const translatedDescription = await translateString(
				place.description?.en_US ||
					(place.description && Object.values(place.description)[0]),
			);
			place.description = {
				...place.description,
				[outputLanguage]: translatedDescription,
			};
		}

		if (!place.address?.city[outputLanguage]) {
			const translatedCity = await translateString(
				place.address?.city?.en_US || Object.values(place.address.city)[0],
			);
			place.address.city = {
				...place.address.city,
				[outputLanguage]: translatedCity,
			};
		}

		if (!place.address?.country[outputLanguage]) {
			const translatedCountry = await translateString(
				place.address?.country?.en_US ||
					Object.values(place.address.country)[0],
			);
			place.address.country = {
				...place.address.country,
				[outputLanguage]: translatedCountry,
			};
		}

		if (place.address.province && !place.address?.province[outputLanguage]) {
			const translatedProvince = await translateString(
				place.address?.province?.en_US ||
					(place.address.province && Object.values(place.address.province)[0]),
			);
			place.address.province = {
				...place.address.province,
				[outputLanguage]: translatedProvince,
			};
		}

		// Don't translate street
		if (place.address.street && !place.address?.street[outputLanguage]) {
			place.address.street = {
				...place.address.street,
				[outputLanguage]:
					place.address?.street?.en_US ||
					(place.address.street && Object.values(place.address.street)[0]),
			};
		}

		await place.save();
		console.log(`${place.name} translated!`);
	} catch (error) {
		console.error(error);
	}
}

async function TranslateAllPlacesWithDescription(outputLanguage: Languages) {
	const query = {
		description: { $exists: true },
		deleted: { $ne: true },
		$or: [
			{ [`nameTranslations.${outputLanguage}`]: { $exists: false } },
			{ [`description.${outputLanguage}`]: { $exists: false } },
			{ [`address.city.${outputLanguage}`]: { $exists: false } },
			{ [`address.country.${outputLanguage}`]: { $exists: false } },
			{ [`address.province.${outputLanguage}`]: { $exists: false } },
			{ [`address.street.${outputLanguage}`]: { $exists: false } },
		],
	};
	const places = await MongoPlaceModel.find(query);
	let index = 0;
	for (const place of places) {
		index++;
		console.log(`Translating place ${index}/${places.length}`);
		await TranslatePlace(place.id, outputLanguage);
	}
}

TranslateAllPlacesWithDescription('es_ES');
