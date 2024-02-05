import "../../connection.js";
import {
  PollyClient,
  StartSpeechSynthesisTaskCommand,
  LanguageCode as LanguageCodePolly,
} from "@aws-sdk/client-polly"; // ES Modules import
import deepl, { LanguageCode as LanguageCodeDeepl } from "deepl-node";
import { DescribeVoicesCommand } from "@aws-sdk/client-polly";
import { MongoMediaModel } from "../infrastructure/mongoModel/MongoMediaModel.js";
import { ApolloError } from "apollo-server-errors";
import { Languages } from "../../shared/Types.js";

export default async function TranslateMedia(
  id: string,
  outputLanguage: Languages
) {
  let outputLanguageDeepl: LanguageCodeDeepl;
  let outputLanguagePolly: LanguageCodePolly;
  switch (outputLanguage) {
    case "fr_FR":
      outputLanguageDeepl = "fr";
      outputLanguagePolly = "fr-FR";
      break;
    case "en_US":
      outputLanguageDeepl = "en-US";
      outputLanguagePolly = "en-US";
      break;
    case "es_ES":
      outputLanguageDeepl = "es";
      outputLanguagePolly = "es-ES";
      break;
    default:
      outputLanguageDeepl = "en-US";
      outputLanguagePolly = "en-US";
      break;
  }
  const media = await MongoMediaModel.findById(id);
  if (!media) {
    throw new ApolloError("Media not found", "MEDIA_NOT_FOUND");
  }
  try {
    const translator = new deepl.Translator(process.env.DEEPL_AUTH_KEY!);
    const client = new PollyClient({
      region: "eu-west-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID_MONUM!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_MONUM!,
      },
    });
    const { text: newTitle } = await translator.translateText(
      media.title["en_US"],
      null,
      outputLanguageDeepl
    );
    const { text: newText } = await translator.translateText(
      media.text["en_US"],
      null,
      outputLanguageDeepl
    );
    const commandListVoices = new DescribeVoicesCommand({
      LanguageCode: outputLanguagePolly,
      Engine: "neural",
    });
    const responsesListVoices = await client.send(commandListVoices);
    const voiceId =
      (Array.isArray(responsesListVoices.Voices) &&
        responsesListVoices.Voices[0].Id) ||
      "";
    const s3Key = `${media.placeId}/${outputLanguage}/${media._id.toString()}`;
    const command = new StartSpeechSynthesisTaskCommand({
      Engine: "neural",
      Text: newText || "",
      OutputFormat: "mp3",
      OutputS3BucketName: process.env.S3_BUCKET_AUDIOS!,
      OutputS3KeyPrefix: s3Key,
      VoiceId: voiceId || undefined,
      LanguageCode: outputLanguagePolly,
    });
    const response = await client.send(command);
    const key = response?.SynthesisTask?.OutputUri?.split(
      `${process.env.S3_BUCKET_AUDIOS!}/`
    )[1];
    if (!key) {
      throw new Error("Error while creating audio");
    }
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

async function TranslateAllMedias(outputLanguage: Languages) {
  const query = {
    $or: [
      { [`title.${outputLanguage}`]: { $exists: false } },
      { [`text.${outputLanguage}`]: { $exists: false } },
      { [`audioUrl.${outputLanguage}`]: { $exists: false } },
      { [`voiceId.${outputLanguage}`]: { $exists: false } },
    ],
  };
  const medias = await MongoMediaModel.find(query);
  for (const media of medias) {
    await TranslateMedia(media.id, outputLanguage);
  }
  console.log("All medias translated!");
}

// TranslateAllMedias('fr_FR');
// TranslateMedia('65be320dfa2cf40774610ef3', 'fr_FR');
