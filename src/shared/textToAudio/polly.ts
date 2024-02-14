import {
  PollyClient,
  StartSpeechSynthesisTaskCommand,
  LanguageCode as LanguageCodePolly,
  DescribeVoicesCommand,
} from "@aws-sdk/client-polly"; // ES Modules import
import { Languages } from "../Types";

const client = new PollyClient({
  region: "eu-west-1",
});

export async function textToAudio(
  text: string,
  language: Languages,
  s3Key: string
) {
  let outputLanguagePolly: LanguageCodePolly;
  switch (language) {
    case "fr_FR":
      outputLanguagePolly = "fr-FR";
      break;
    case "en_US":
      outputLanguagePolly = "en-US";
      break;
    case "es_ES":
      outputLanguagePolly = "es-ES";
      break;
    case "ca_ES":
      outputLanguagePolly = "ca-ES";
      break;
    default:
      throw new Error("Language not supported");
  }
  const commandListVoices = new DescribeVoicesCommand({
    LanguageCode: outputLanguagePolly,
    Engine: "neural",
  });
  const responsesListVoices = await client.send(commandListVoices);
  const voiceId =
    (Array.isArray(responsesListVoices.Voices) &&
      responsesListVoices.Voices[0].Id) ||
    "";
  const command = new StartSpeechSynthesisTaskCommand({
    Engine: "neural",
    Text: text,
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
  return { key, voiceId };
}
