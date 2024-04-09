import {
  PollyClient,
  StartSpeechSynthesisTaskCommand,
  DescribeVoicesCommand,
  LanguageCode,
} from "@aws-sdk/client-polly";
import { Buffer } from "buffer";
import { MongoPlaceModel } from "../../places/infrastructure/mongoModel/MongoPlaceModel.js";
import { MongoMediaModel } from "../infrastructure/mongoModel/MongoMediaModel.js";
import { ApolloError } from "apollo-server-errors";
import { Languages } from "../../shared/Types";
import { MediaType } from "../domain/types/MediaType.js";
import {
  getMediaDuration,
  getTranslatedMedia,
} from "../domain/functions/Media.js";
import {
  S3Client,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

async function createTextMedia(
  placeId: string,
  language: Languages,
  title: string,
  text: string,
  rating: number
) {
  const place = await MongoPlaceModel.findById(placeId);
  if (!place) {
    throw new ApolloError("Place not found", "PLACE_NOT_FOUND");
  }

  const titleObj = {
    [language]: title,
  };
  const textObj = {
    [language]: text,
  };

  const mediaModel = new MongoMediaModel({
    placeId,
    rating,
    title: titleObj,
    text: textObj,
    voiceId: {},
    url: {},
    duration: {},
    type: "text",
  });
  await mediaModel.save();
  return await getTranslatedMedia(mediaModel.toObject(), language);
}

async function createAudioMedia(
  placeId: string,
  language: Languages,
  title: string,
  text: string,
  rating: number
) {
  const place = await MongoPlaceModel.findById(placeId);
  if (!place) {
    throw new ApolloError("Place not found", "PLACE_NOT_FOUND");
  }
  const client = new PollyClient({
    region: "eu-west-1",
  });
  const s3Client = new S3Client({ region: "eu-west-1" });

  try {
    const commandListVoices = new DescribeVoicesCommand({
      LanguageCode: language.replace("_", "-") as LanguageCode,
      Engine: "neural",
    });
    const responsesListVoices = await client.send(commandListVoices);
    const voiceId =
      (Array.isArray(responsesListVoices.Voices) &&
        responsesListVoices.Voices[0].Id) ||
      "";

    try {
      const titleObj = {
        [language]: title,
      };
      const textObj = {
        [language]: text,
      };
      const voiceIdObj = {
        [language]: voiceId,
      };

      const mediaModel = new MongoMediaModel({
        placeId,
        rating,
        title: titleObj,
        text: textObj,
        voiceId: voiceIdObj,
        url: {},
        duration: {},
        type: "audio",
        format: "mp3",
      });
      const s3Key = `${placeId}/en_US/${mediaModel._id.toString()}`;
      const command = new StartSpeechSynthesisTaskCommand({
        Engine: "neural",
        Text: text || "",
        OutputFormat: "mp3",
        OutputS3BucketName: process.env.S3_BUCKET_AUDIOS!,
        OutputS3KeyPrefix: s3Key,
        VoiceId: voiceId || undefined,
        LanguageCode: language.replace("_", "-") as LanguageCode,
      });
      const response = await client.send(command);
      const key = response?.SynthesisTask?.OutputUri?.split(
        `${process.env.S3_BUCKET_AUDIOS!}/`
      )[1];

      if (key && mediaModel.url) {
        mediaModel.url[language] = key;
        // Polling mechanism to check if the file is available in S3
        let fileExists = false;
        const checkFileExists = async () => {
          try {
            // Use S3 SDK to check if the object exists in the bucket
            const headObjectCommand = new HeadObjectCommand({
              Bucket: process.env.S3_BUCKET_AUDIOS!,
              Key: key,
            });
            await s3Client.send(headObjectCommand); // If object exists, no error will be thrown
            fileExists = true;
          } catch (error) {
            fileExists = false;
          }
        };

        while (!fileExists) {
          await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for 2 seconds
          await checkFileExists();
        }
        await mediaModel.save();
        const duration = await getMediaDuration(
          mediaModel._id.toString(),
          language
        );
        if (duration === 0 || !duration) {
          throw new ApolloError(
            "Something went wrong calculating the duration of the audio",
            "AWS_POLLY_ERROR_AUDIO_WAS_BEEN_CREATED"
          );
        }
        mediaModel.duration[language] = duration;
        await mediaModel.save();
        return await getTranslatedMedia(mediaModel.toObject(), language);
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
  } catch (error) {
    console.log("Error", error);
    throw error;
  }
}

async function createVideoMedia(
  placeId: string,
  language: Languages,
  title: string,
  rating: number,
  videoBase64: string
) {
  const place = await MongoPlaceModel.findById(placeId);
  if (!place) {
    throw new ApolloError("Place not found", "PLACE_NOT_FOUND");
  }
  const s3Client = new S3Client({ region: "eu-west-1" });

  // Decode base64 data
  const binaryData = Buffer.from(videoBase64, "base64");

  try {
    const titleObj = {
      [language]: title,
    };

    const mediaModel = new MongoMediaModel({
      placeId,
      rating,
      title: titleObj,
      text: {},
      voiceId: {},
      url: {},
      duration: {},
      type: "video",
      format: "mp4",
    });

    const s3Key = `${placeId}/en_US/${mediaModel._id.toString()}`;

    // Upload the decoded binary data to S3
    const params = {
      Bucket: process.env.S3_BUCKET_AUDIOS!,
      Key: s3Key,
      Body: binaryData,
      ContentType: "video/mp4",
    };

    try {
      const response = await s3Client.send(new PutObjectCommand(params));
      if (
        response.$metadata.httpStatusCode === 200 &&
        s3Key &&
        mediaModel.url
      ) {
        mediaModel.url[language] = s3Key;
        await mediaModel.save();
        // const duration = await getMediaDuration(
        //   mediaModel._id.toString(),
        //   language
        // );
        // console.log("Duration", duration);
        // if (duration === 0 || !duration) {
        //   throw new ApolloError(
        //     "Something went wrong calculating the duration of the video",
        //     "VIDEO_DURATION_CALCULATION_ERROR"
        //   );
        // }
        mediaModel.duration[language] = 10;
        await mediaModel.save();
        return await getTranslatedMedia(mediaModel.toObject(), language);
      } else {
        throw new ApolloError(
          "Something went wrong while video was being created",
          "ERROR_WHILE_VIDEO_WAS_BEING_CREATED"
        );
      }
    } catch (error) {
      console.error("Error uploading to S3:", error);
      throw new Error("Failed to upload to S3");
    }
  } catch (error) {
    console.log("Error", error);
    throw error;
  }
}

export default async function CreateMediaUseCase(
  placeId: string,
  language: Languages,
  title: string,
  type: MediaType,
  rating: number,
  text?: string,
  videoBase64?: string
) {
  switch (type) {
    case "text":
      if (!text) {
        throw new ApolloError("Text is required", "TEXT_REQUIRED");
      }
      return await createTextMedia(placeId, language, title, text, rating);
    case "audio":
      if (!text) {
        throw new ApolloError("Text is required", "TEXT_REQUIRED");
      }
      return await createAudioMedia(placeId, language, title, text, rating);
    case "video":
      return await createVideoMedia(
        placeId,
        language,
        title,
        rating,
        videoBase64!
      );
    default:
      throw new ApolloError("Invalid media type", "INVALID_MEDIA_TYPE");
  }
}
