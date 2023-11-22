import { Photo as PexelsPhoto, createClient } from "pexels";
import ICity from "../domain/interfaces/ICity.js";
import { MongoCityModel } from "../infrastructure/mongoModel/MongoCityModel.js";
import * as deepl from "deepl-node";
import Photo from "../domain/valueObjects/Photo.js";
import { GraphQLError } from "graphql";

interface LanguagesToTranslate {
  language: string;
  deeplLanguage: deepl.TargetLanguageCode;
}

interface Translations {
  en_US: string;
  [key: string]: string;
}

export default async function CreateCityByEnglishNameUseCase(
  englishName: string
): Promise<ICity> {
  try {
    const languagesToTranslate: LanguagesToTranslate[] = [
      { language: "es_ES", deeplLanguage: "es" },
      { language: "fr_FR", deeplLanguage: "fr" },
    ];
    let translations: Translations = { en_US: englishName };
    const translator = new deepl.Translator(process.env.DEEPL_AUTH_KEY!);
    for (const language of languagesToTranslate) {
      const { text: name } = await translator.translateText(
        englishName,
        null,
        language.deeplLanguage
      );
      translations[language.language] = name;
    }
    const pexelsClient = createClient(process.env.PEXELS_API_KEY!);
    let cityPhoto: Photo;
    const photosPexels: any = await pexelsClient.photos.search({
      query: englishName,
      per_page: 1,
    });
    if (Array.isArray(photosPexels.photos)) {
      cityPhoto = new Photo({
        pexelsId: photosPexels.photos[0].id.toString(),
        width: photosPexels.photos[0].width,
        height: photosPexels.photos[0].height,
        url: photosPexels.photos[0].src.original,
      });
    } else {
      cityPhoto = new Photo({
        pexelsId: "",
        width: 0,
        height: 0,
        url: "",
      });
    }
    return await MongoCityModel.create({
      translations,
      photo: cityPhoto,
    });
  } catch (error) {
    console.log(error);
    throw error;
  }
}
