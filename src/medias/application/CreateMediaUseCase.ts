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
  rating?: number
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
  mediaModel.duration[language] = 0;
  await mediaModel.save();
  return await getTranslatedMedia(mediaModel.toObject(), language);
}

async function createAudioMedia(
  placeId: string,
  language: Languages,
  title: string,
  text: string,
  rating?: number
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

      let mediaModel = new MongoMediaModel({
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
        while (!fileExists) {
          await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for 2 seconds
          try {
            // Use S3 SDK to check if the object exists in the bucket
            const headObjectCommand = new HeadObjectCommand({
              Bucket: process.env.S3_BUCKET_AUDIOS!,
              Key: key,
            });
            await s3Client.send(headObjectCommand); // If object exists, no error will be thrown
            fileExists = true;
            mediaModel.duration[language] = 1100;
            await mediaModel.save();

            const duration = await getMediaDuration(
              mediaModel._id.toString(),
              language
            );
            console.log("The duration of the audio uploaded is ", duration);
            if (duration === 0 || !duration) {
              throw new ApolloError(
                "Something went wrong calculating the duration of the audio",
                "AWS_POLLY_ERROR_AUDIO_WAS_BEEN_CREATED"
              );
            }
            const filter = { _id: mediaModel._id };
            const update = { [`duration.${language}`]: Math.floor(duration) };

            const doc = await MongoMediaModel.findOneAndUpdate(filter, update, {
              new: true, // return the updated document
              useFindAndModify: false, // to use MongoDB driver's findOneAndUpdate() instead of findAndModify()
            });

            if (doc) {
              return await getTranslatedMedia(doc.toObject(), language);
            } else {
              throw new ApolloError(
                "Failed to update media duration",
                "MONGO_UPDATE_ERROR"
              );
            }
          } catch (error) {
            fileExists = false;
            console.log("Audio not created yet, checking again...");
          }
        }
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
  videoBase64: string,
  videoDurationInSeconds: number,
  rating?: number
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
        mediaModel.duration[language] = videoDurationInSeconds;
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
  text?: string,
  videoBase64?: string,
  videoDurationInSeconds?: number,
  rating?: number
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
      if (!videoBase64 || !videoDurationInSeconds) {
        throw new ApolloError(
          "Video base64 and video duration are required for 'video' type",
          "VIDEO_BASE64_AND_DURATION_REQUIRED"
        );
      }
      return await createVideoMedia(
        placeId,
        language,
        title,
        videoBase64,
        videoDurationInSeconds,
        rating
      );
    default:
      throw new ApolloError("Invalid media type", "INVALID_MEDIA_TYPE");
  }
}
