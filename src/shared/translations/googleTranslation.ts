import { TranslationServiceClient } from "@google-cloud/translate";
import { Languages } from "../Types";
import dotenv from "dotenv";
dotenv.config();

const translationClient = new TranslationServiceClient();
const projectId = process.env.GOOGLE_PROJECT_ID;
const location = "global";

export async function translateStringGoogle(
  text: string,
  outputLanguage: Languages
): Promise<string> {
  let outputLanguageGoogle: string;
  switch (outputLanguage) {
    case "fr_FR":
      outputLanguageGoogle = "fr";
      break;
    case "en_US":
      outputLanguageGoogle = "en";
      break;
    case "es_ES":
      outputLanguageGoogle = "es";
      break;
    case "ca_ES":
      outputLanguageGoogle = "ca";
      break;
    default:
      throw new Error("Language not supported");
  }
  try {
    const request = {
      parent: `projects/${projectId}/locations/${location}`,
      contents: [text],
      mimeType: "text/plain",
      sourceLanguageCode: "en",
      targetLanguageCode: outputLanguageGoogle,
    };

    const [response] = await translationClient.translateText(request);
    if (
      !response.translations ||
      response.translations.length === 0 ||
      !response.translations[0].translatedText
    ) {
      throw new Error("Error while translating");
    }
    const newText = response.translations[0].translatedText;
    return newText;
  } catch (error) {
    console.error(error);
    return text || "";
  }
}
