import { Configuration, OpenAIApi } from "openai";
import {
  PollyClient,
  StartSpeechSynthesisTaskCommand,
  DescribeVoicesCommand,
  LanguageCode,
} from "@aws-sdk/client-polly"; // ES Modules import
import { MongoPlaceModel } from "../../places/infrastructure/mongoModel/MongoPlaceModel.js";
import { MongoMediaModel } from "../infrastructure/mongoModel/MongoMediaModel.js";
import { ApolloError } from "apollo-server-errors";

interface PopulateMediaByNumberDTO {
  placeId: string; // Normally will be the city
  number?: number;
  language?: LanguageCode;
}

export default async function PopulateMediaByNumberUseCase({
  placeId,
  number = 5,
  language = "en-US",
}: PopulateMediaByNumberDTO) {
  const place = await MongoPlaceModel.findById(placeId);
  if (!place) {
    throw new ApolloError("Place not found", "PLACE_NOT_FOUND");
  }
  const configuration = new Configuration({
    organization: process.env.OPENAI_ORGANIZATION_ID || "",
    apiKey: process.env.OPENAI_API_KEY || "",
  });
  const openai = new OpenAIApi(configuration);
  const client = new PollyClient({
    region: "eu-west-1",
  });
  try {
    const commandListVoices = new DescribeVoicesCommand({
      LanguageCode: language,
      Engine: "neural",
    });
    const responsesListVoices = await client.send(commandListVoices);
    const voiceId =
      (Array.isArray(responsesListVoices.Voices) &&
        responsesListVoices.Voices[0].Id) ||
      "";
    const mediaString = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `I want to populate my MongoDB database. This database must contain the most important themes or topics of a place of interest. This topic or theme must be developed in depth so that it can be read later and the audios will be between 3 and 5 minutes long. For this reason, I ask you to give me back a list of the ${number} most important topics or themes of the ${place.name} place of interest.
            The structure of the objects that make up my database is as follows:
            {
              "title": <string> (title of the theme or topic),
              "text": <string> (text between 400 and 600 words),
              "rating": <number> (random float between 0-5 with 2 decimal places, for example: 3.67),
            }
            The answer you have to give me must be convertible into a JSON directly with the JSON.parse() function so that I can insert it directly into my database. Therefore, you only have to give me back what I ask you (without any introduction or additional text) only what I have asked you strictly.`,
        },
      ],
    });
    const mediaJSON = JSON.parse(
      mediaString.data.choices[0].message?.content || ""
    );
    if (!Array.isArray(mediaJSON)) {
      throw new ApolloError(
        "Response from OpenAI is not in the format we were expecting",
        "OPEN_AI_RESPONSE_BAD_FORMAT"
      );
    }
    return await Promise.all(
      mediaJSON.map(async (media) => {
        try {
          const mediaModel = new MongoMediaModel({
            ...media,
            language,
            place,
            voiceId,
          });
          const command = new StartSpeechSynthesisTaskCommand({
            Engine: "neural",
            Text: mediaModel?.text || "",
            OutputFormat: "mp3",
            OutputS3BucketName: `monum-polly`,
            OutputS3KeyPrefix: `${placeId}/${language}/${mediaModel._id.toString()}`,
            VoiceId: voiceId || undefined,
            LanguageCode: language,
          });
          const response = await client.send(command);
          if (response?.SynthesisTask?.OutputUri) {
            mediaModel.audioUrl = response?.SynthesisTask?.OutputUri;
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
      })
    );
  } catch (error) {
    console.log("Error", error);
    throw error;
  }
}
