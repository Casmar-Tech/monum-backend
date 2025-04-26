import { ICity } from "../domain/interfaces/ICity.js";
import { MongoCityModel } from "../infrastructure/mongoModel/MongoCityModel.js";
import * as deepl from "deepl-node";

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
    let name: Translations = { en_US: englishName };
    const translator = new deepl.Translator(process.env.DEEPL_AUTH_KEY!);
    for (const language of languagesToTranslate) {
      const { text: translation } = await translator.translateText(
        englishName,
        null,
        language.deeplLanguage
      );
      name[language.language] = translation;
    }
    return await MongoCityModel.create({
      name,
    });
  } catch (error) {
    console.log(error);
    throw error;
  }
}
