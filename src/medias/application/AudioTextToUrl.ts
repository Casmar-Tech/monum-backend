import {
  DescribeVoicesCommand,
  Engine,
  LanguageCode,
  PollyClient,
  StartSpeechSynthesisTaskCommand,
} from "@aws-sdk/client-polly";
import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { ApolloError } from "apollo-server-errors";

export default async function AudioTextToUrl(
  placeId: string,
  mediaId: string,
  language: string,
  text: string
): Promise<string> {
  const client = new PollyClient({
    region: "us-east-1",
  });
  const s3Client = new S3Client({ region: "us-east-1" });

  const voicesByLanguage: any = {
    es_ES: {
      engine: "generative",
      id: "Sergio",
    },
    ca_ES: {
      engine: "neural",
      id: "Arlet",
    },
    en_US: {
      engine: "generative",
      id: "Matthew",
    },
    fr_FR: {
      engine: "generative",
      id: "Remi",
    },
  };
  try {
    const commandListVoices = new DescribeVoicesCommand({
      LanguageCode: language.replace("_", "-") as LanguageCode,
      Engine: voicesByLanguage[language].engine as Engine,
    });
    const responsesListVoices = await client.send(commandListVoices);
    const voiceId =
      (Array.isArray(responsesListVoices.Voices) &&
        responsesListVoices.Voices.find(
          (voice) => voice.Id === voicesByLanguage[language].id
        )?.Id) ||
      "";

    const s3Key = `${placeId}/en_US/${mediaId}`;

    const command = new StartSpeechSynthesisTaskCommand({
      Engine: "neural",
      Text: text || "",
      OutputFormat: "mp3",
      OutputS3BucketName: "monum-polly-us-east-1",
      OutputS3KeyPrefix: s3Key,
      VoiceId: voiceId || undefined,
      LanguageCode: language.replace("_", "-") as LanguageCode,
    });
    const response = await client.send(command);
    const key = response?.SynthesisTask?.OutputUri?.split(
      `$monum-polly-us-east-1/`
    )?.[1];

    if (key) {
      // Polling mechanism to check if the file is available in S3
      let fileExists = false;
      while (!fileExists) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        try {
          // Use S3 SDK to check if the object exists in the bucket
          const headObjectCommand = new HeadObjectCommand({
            Bucket: "monum-polly-us-east-1",
            Key: key,
          });
          await s3Client.send(headObjectCommand); // If object exists, no error will be thrown
          fileExists = true;
        } catch (error) {
          fileExists = false;
          console.log("Audio not created yet, checking again...");
        }
      }
      return key;
    } else {
      throw new ApolloError(
        "Something went wrong while audio was being created",
        "AWS_POLLY_ERROR_AUDIO_WAS_BEEN_CREATED"
      );
    }
  } catch (error) {
    console.log("Error", error);
    throw error;
  }
}
