import OpenAI from "openai";
import {
  PollyClient,
  StartSpeechSynthesisTaskCommand,
  DescribeVoicesCommand,
} from "@aws-sdk/client-polly"; // ES Modules import
import { MongoPlaceModel } from "../../places/infrastructure/mongoModel/MongoPlaceModel.js";
import { MongoMediaModel } from "../infrastructure/mongoModel/MongoMediaModel.js";
import { ApolloError } from "apollo-server-errors";
import { IMediaTopic } from "../domain/IMediaTopic.js";
import { getTranslatedPlace } from "../../places/domain/functions/Place.js";

export default async function PopulateMediaByTopic(
  placeId: string,
  topic: IMediaTopic
) {
  const place = await MongoPlaceModel.findById(placeId);
  if (!place) {
    throw new ApolloError("Place not found", "PLACE_NOT_FOUND");
  }
  const placeTranslated = await getTranslatedPlace(place.toObject(), "en_US");
  const client = new PollyClient({
    region: "eu-west-1",
  });
  const openai = new OpenAI();
  try {
    const commandListVoices = new DescribeVoicesCommand({
      LanguageCode: "en-US",
      Engine: "neural",
    });
    const responsesListVoices = await client.send(commandListVoices);
    const voiceId =
      (Array.isArray(responsesListVoices.Voices) &&
        responsesListVoices.Voices[0].Id) ||
      "";
    const mediaString = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-1106",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant designed to output JSON.",
        },
        {
          role: "user",
          content: `I would like you to write me a text about this place of interest: ${placeTranslated.name} located in ${placeTranslated.address.city}.
          The topic must be about ${topic.topic} and must be aprox 800 words long.
					The answer must have a "title" () and a "text". `,
        },
      ],
    });
    const { title, text } = JSON.parse(
      mediaString.choices[0].message?.content || ""
    );
    try {
      const mediaModel = new MongoMediaModel({
        placeId,
        rating: parseFloat((Math.random() * 2 + 3).toFixed(2)),
        title: {
          en_US: title,
        },
        text: {
          en_US: text,
        },
        voiceId: {
          en_US: voiceId,
        },
        audioUrl: {},
        topicId: topic._id,
      });
      const s3Key = `${placeId}/en_US/${mediaModel._id.toString()}`;
      const command = new StartSpeechSynthesisTaskCommand({
        Engine: "neural",
        Text: text || "",
        OutputFormat: "mp3",
        OutputS3BucketName: process.env.S3_BUCKET_AUDIOS!,
        OutputS3KeyPrefix: s3Key,
        VoiceId: voiceId || undefined,
        LanguageCode: "en-US",
      });
      const response = await client.send(command);
      const key = response?.SynthesisTask?.OutputUri?.split(
        `${process.env.S3_BUCKET_AUDIOS!}/`
      )[1];
      if (key) {
        mediaModel.audioUrl["en_US"] = key;
        return mediaModel.save();
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
