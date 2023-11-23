import {
  LanguageCode,
  PollyClient,
  StartSpeechSynthesisTaskCommand,
} from "@aws-sdk/client-polly"; // ES Modules import
import * as deepl from "deepl-node";
import { DescribeVoicesCommand } from "@aws-sdk/client-polly";
import { MongoMediaModel } from "../infrastructure/mongoModel/MongoMediaModel.js";
import { ApolloError } from "apollo-server-errors";

interface TranslateMediaDTO {
  id: string;
  outputLanguage: LanguageCode;
}

export default async function TranslateMediaUseCase({
  id,
  outputLanguage,
}: TranslateMediaDTO) {
  let outputLanguageDeepl: "fr" | "en-US" | "es";
  switch (outputLanguage) {
    case "fr-FR":
      outputLanguageDeepl = "fr";
      break;
    case "en-US":
      outputLanguageDeepl = "en-US";
      break;
    case "es-ES":
      outputLanguageDeepl = "es";
      break;
    default:
      outputLanguageDeepl = "en-US";
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
    });
    const { text: newTitle } = await translator.translateText(
      media.title,
      null,
      outputLanguageDeepl
    );
    const { text: newText } = await translator.translateText(
      media.text,
      null,
      outputLanguageDeepl
    );
    const commandListVoices = new DescribeVoicesCommand({
      LanguageCode: outputLanguage,
      Engine: "neural",
    });
    const responsesListVoices = await client.send(commandListVoices);
    const voiceId =
      (Array.isArray(responsesListVoices.Voices) &&
        responsesListVoices.Voices[0].Id) ||
      "";
    const command = new StartSpeechSynthesisTaskCommand({
      Engine: "neural",
      Text: newText || "",
      OutputFormat: "mp3",
      OutputS3BucketName: "monum-polly",
      OutputS3KeyPrefix: `${media.place._id}/${outputLanguage}/`,
      VoiceId: voiceId || undefined,
      LanguageCode: outputLanguage,
    });
    const response = await client.send(command);
    return MongoMediaModel.create({
      rating: media.rating,
      place: media.place,
      audioUrl: response.SynthesisTask?.OutputUri || "",
      language: outputLanguage,
      text: newText,
      title: newTitle,
      voiceId,
    });
  } catch (error) {
    console.log("Error", error);
    throw error;
  }
}
