import deepl, { LanguageCode as LanguageCodeDeepl } from "deepl-node";
import { Languages } from "../Types";

const translator = new deepl.Translator(process.env.DEEPL_AUTH_KEY!);

export async function translateStringDeepl(
  text: string,
  outputLanguage: Languages
): Promise<string> {
  let outputLanguageDeepl: LanguageCodeDeepl;
  switch (outputLanguage) {
    case "fr_FR":
      outputLanguageDeepl = "fr";
      break;
    case "en_US":
      outputLanguageDeepl = "en-US";
      break;
    case "es_ES":
      outputLanguageDeepl = "es";
      break;
    default:
      throw new Error("Language not supported");
  }
  try {
    const { text: newText } = await translator.translateText(
      text,
      "en",
      outputLanguageDeepl
    );
    return newText;
  } catch (error) {
    console.error(error);
    return text || "";
  }
}
