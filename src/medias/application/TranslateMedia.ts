import "../../connection.js";
import { translateStringDeepl } from "../../shared/translations/deepl.js";
import { translateStringGoogle } from "../../shared/translations/googleTranslation.js";
import { textToAudio } from "../../shared/textToAudio/polly.js";
import { MongoMediaModel } from "../infrastructure/mongoModel/MongoMediaModel.js";
import { ApolloError } from "apollo-server-errors";
import { Languages } from "../../shared/Types.js";

export default async function TranslateMedia(
  id: string,
  outputLanguage: Languages,
  translationPlatform: "deepl" | "google" = "deepl"
) {
  const media = await MongoMediaModel.findById(id);
  if (!media) {
    throw new ApolloError("Media not found", "MEDIA_NOT_FOUND");
  }
  try {
    const translateFunction =
      translationPlatform === "deepl"
        ? translateStringDeepl
        : translateStringGoogle;
    const newTitle = await translateFunction(
      media.title["en_US"],
      outputLanguage
    );
    const newText = await translateFunction(
      media.text["en_US"],
      outputLanguage
    );
    const s3Key = `${media.placeId}/${outputLanguage}/${media._id.toString()}`;
    const { key, voiceId } = await textToAudio(newText, outputLanguage, s3Key);
    const mediaTranslated = await MongoMediaModel.findByIdAndUpdate(id, {
      title: {
        ...media.title,
        [outputLanguage]: newTitle,
      },
      text: {
        ...media.text,
        [outputLanguage]: newText,
      },
      audioUrl: {
        ...media.audioUrl,
        [outputLanguage]: key,
      },
      voiceId: {
        ...media.voiceId,
        [outputLanguage]: voiceId,
      },
    });
    console.log(`Media ${id} translated to ${outputLanguage}`);
    return mediaTranslated;
  } catch (error) {
    console.log("Error", error);
    throw error;
  }
}

async function TranslateAllMedias(
  outputLanguage: Languages,
  translationPlatform: "deepl" | "google" = "deepl"
) {
  const query = {
    $or: [
      { [`title.${outputLanguage}`]: { $exists: false } },
      { [`text.${outputLanguage}`]: { $exists: false } },
      { [`audioUrl.${outputLanguage}`]: { $exists: false } },
      { [`voiceId.${outputLanguage}`]: { $exists: false } },
    ],
  };
  const medias = await MongoMediaModel.find(query);
  console.log("medias", medias.length);
  let index = 0;
  for (const media of medias) {
    index++;
    console.log(`Translating media ${index}/${medias.length}`);
    await TranslateMedia(media.id, outputLanguage, translationPlatform);
  }
  console.log("All medias translated!");
}

// TranslateAllMedias("es_ES", "google");
// TranslateMedia('65be320dfa2cf40774610ef3', 'fr_FR');
