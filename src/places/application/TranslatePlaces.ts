import "../../connection.js";
import deepl, {
  TargetLanguageCode as TargetLanguageCodeDeepl,
} from "deepl-node";
import { MongoPlaceModel } from "../infrastructure/mongoModel/MongoPlaceModel.js";
import { Languages } from "../../shared/Types.js";
import { translateStringGoogle } from "../../shared/translations/googleTranslation.js";
import { translateStringDeepl } from "../../shared/translations/deepl.js";

async function TranslatePlace(
  placeId: string,
  outputLanguage: Languages,
  translationPlatform: "deepl" | "google" = "deepl"
) {
  let place = await MongoPlaceModel.findById(placeId);
  if (!place) {
    throw new Error("Place not found");
  }
  try {
    const translateFunction =
      translationPlatform === "deepl"
        ? translateStringDeepl
        : translateStringGoogle;
    if (!place.nameTranslations[outputLanguage]) {
      const translatedName = await translateFunction(
        place.name,
        outputLanguage
      );
      place.nameTranslations = {
        ...place.nameTranslations,
        [outputLanguage]: translatedName,
      };
    }

    if (place.description && !place.description[outputLanguage]) {
      const translatedDescription = await translateFunction(
        place.description?.en_US ||
          (place.description && Object.values(place.description)[0]),
        outputLanguage
      );
      place.description = {
        ...place.description,
        [outputLanguage]: translatedDescription,
      };
    }

    if (!place.address?.city[outputLanguage]) {
      const translatedCity = await translateFunction(
        place.address?.city?.en_US || Object.values(place.address.city)[0],
        outputLanguage
      );
      place.address.city = {
        ...place.address.city,
        [outputLanguage]: translatedCity,
      };
    }

    if (!place.address?.country[outputLanguage]) {
      const translatedCountry = await translateFunction(
        place.address?.country?.en_US ||
          Object.values(place.address.country)[0],
        outputLanguage
      );
      place.address.country = {
        ...place.address.country,
        [outputLanguage]: translatedCountry,
      };
    }

    if (place.address.province && !place.address?.province[outputLanguage]) {
      const translatedProvince = await translateFunction(
        place.address?.province?.en_US ||
          (place.address.province && Object.values(place.address.province)[0]),
        outputLanguage
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

async function TranslateAllPlacesWithDescription(
  outputLanguage: Languages,
  translationPlatform: "deepl" | "google" = "deepl"
) {
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
    await TranslatePlace(place.id, outputLanguage, translationPlatform);
  }
}

// TranslateAllPlacesWithDescription('ca_ES', 'google');
