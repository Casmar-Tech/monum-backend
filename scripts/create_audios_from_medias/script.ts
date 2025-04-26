import medias from "./medias-translated.json";
import "../../src/connection.js";
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
import { ApolloError } from "apollo-server-errors";
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { MongoPlaceModel } from "../../src/places/infrastructure/mongoModel/MongoPlaceModel.js";
import { Languages } from "../../src/shared/Types.js";
import { MongoMediaModel } from "../../src/medias/infrastructure/mongoModel/MongoMediaModel.js";
import { getMediaDuration } from "../../src/medias/domain/functions/Media.js";
import OpenAI from "openai";
import { randomUUID } from "crypto";
import {
  DescribeVoicesCommand,
  Engine,
  LanguageCode,
  PollyClient,
  StartSpeechSynthesisTaskCommand,
} from "@aws-sdk/client-polly";

const s3Client = new S3Client({
  region: "eu-west-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID_MONUM!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_MONUM!,
  },
});

const BATCH_SIZE = 20;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_AUDIO_API_KEY_MONUM!,
});

const REMOVE_OLD_MEDIAS = false;
const VOICE_ID = "ash";
const AUDIO_FORMAT = "opus";
const MODEL = "gpt-4o-mini-tts";

const OPENAI_VOICE_INSTRUCTIONS = {
  es_ES:
    "Voz cálida y articulada con acento neutro de Castilla, como un guía turístico experimentado. Tono sereno, transmitiendo un interés genuino por el significado histórico. Ritmo adecuado con pausas estratégicas, permitiendo a los oyentes asimilar la información mientras aprecian su entorno. Personalidad conocedora y cautivadora, equilibrando contenido educativo con un estilo conversacional accesible.",

  ca_ES:
    "Veu càlida i articulada amb accent neutre del català central, com un guia turístic experimentat. To serè, transmetent un interès genuí pel significat històric. Ritme adequat amb pauses estratègiques, permetent als oients assimilar la informació mentre aprecien el seu entorn. Personalitat coneixedora i captivadora, equilibrant contingut educatiu amb un estil conversacional accessible.",

  en_US:
    "Warm and articulate voice with a neutral accent, like an experienced tour guide. Passionate yet calm tone, conveying genuine interest in the historical significance. Well-paced delivery with strategic pauses, allowing listeners to absorb information while appreciating their surroundings. Knowledgeable and engaging personality, balancing educational content with an approachable conversational style.",

  fr_FR:
    "Voix chaleureuse et articulée avec un accent neutre, comme un guide touristique expérimenté. Ton serein, transmettant un intérêt authentique pour la signification historique. Rythme bien cadencé avec des pauses stratégiques, permettant aux auditeurs d'assimiler l'information tout en appréciant leur environnement. Personalité érudite et engageante, équilibrant contenu éducatif et style conversationnel accessible.",
};

const PROVIDERS_BY_LANGUAGE: Record<Languages, string> = {
  es_ES: "openai",
  ca_ES: "openai",
  en_US: "openai",
  fr_FR: "openai",
};

function randomRating() {
  const min = 3.8;
  const max = 5.0;
  const numero = Math.random() * (max - min) + min;
  return parseFloat(numero.toFixed(2));
}

async function generateAudioForLanguageOpenAI(
  placeId: string,
  mediaId: string,
  language: Languages,
  input: string
) {
  const audio = await openai.audio.speech.create({
    model: MODEL,
    voice: VOICE_ID,
    input: input,
    instructions: OPENAI_VOICE_INSTRUCTIONS[language],
    response_format: AUDIO_FORMAT,
  });

  const buffer = Buffer.from(await audio.arrayBuffer());

  const prefix = `${placeId.toString()}/${language}/${mediaId.toString()}-${randomUUID()}`;
  const fileName = `${prefix}.${AUDIO_FORMAT}`;

  const uploadParams = {
    Bucket: "monum-polly",
    Key: fileName,
    Body: buffer,
    ContentType: `audio/${AUDIO_FORMAT}`,
  };

  try {
    await s3Client.send(new PutObjectCommand(uploadParams));

    const update = {
      [`url.${language}`]: fileName,
      [`voiceId.${language}`]: VOICE_ID,
    };
    await MongoMediaModel.findByIdAndUpdate(mediaId, update, {
      new: true,
    });

    const duration = await getMediaDuration(mediaId, language);

    if (duration && duration > 0) {
      console.log(
        `La duración del audio generado en ${language} es de ${duration} segundos`
      );

      const updateDuration = {
        [`duration.${language}`]: Math.floor(duration),
      };
      await MongoMediaModel.findByIdAndUpdate(mediaId, updateDuration, {
        new: true,
      });
    } else {
      console.log(
        `Audio disponible en S3 para ${language}, pero la duración es 0. Reintentando...`
      );
    }
  } catch (error) {
    console.log(
      `Error durante la espera del audio en ${language}, reintentando...`
    );
  }
}

async function generateAudioForLanguageAWS(
  placeId: string,
  mediaId: string,
  language: Languages,
  input: string
) {
  const client = new PollyClient({
    region: "us-east-1",
  });
  const s3Client = new S3Client({ region: "us-east-1" });

  const voicesByLanguage: Record<Languages, { engine: Engine; id: string }> = {
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

  const s3Key = `${placeId}/${language}/${mediaId}-${randomUUID()}`;

  const command = new StartSpeechSynthesisTaskCommand({
    Engine: voicesByLanguage[language].engine as Engine,
    Text: input,
    OutputFormat: "mp3",
    OutputS3BucketName: "monum-polly-us-east-1",
    OutputS3KeyPrefix: s3Key,
    VoiceId: voiceId || undefined,
    LanguageCode: language.replace("_", "-") as LanguageCode,
  });
  const response = await client.send(command);
  const key = response?.SynthesisTask?.OutputUri?.split(
    "monum-polly-us-east-1/"
  )[1];

  if (!key) {
    throw new ApolloError(
      "No se pudo obtener la clave del audio generado",
      "AWS_POLLY_ERROR"
    );
  }

  const prefix = `${placeId}/${language}/`;

  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 10000));

    try {
      const listCommand = new ListObjectsV2Command({
        Bucket: "monum-polly-us-east-1",
        Prefix: prefix,
      });
      const listResponse = await s3Client.send(listCommand);

      if (
        listResponse?.Contents &&
        listResponse.Contents.length > 0 &&
        listResponse.Contents.find((content) => content.Key === key)
      ) {
        const update = {
          [`url.${language}`]: key,
          [`voiceId.${language}`]: voiceId,
        };
        await MongoMediaModel.findByIdAndUpdate(mediaId, update, {
          new: true,
        });

        const duration = await getMediaDuration(mediaId, language);

        if (duration && duration > 0) {
          console.log(
            `La duración del audio generado en ${language} es de ${duration} segundos`
          );

          const updateDuration = {
            [`duration.${language}`]: Math.floor(duration),
          };
          await MongoMediaModel.findByIdAndUpdate(mediaId, updateDuration, {
            new: true,
          });

          break;
        } else {
          console.log(
            `Audio disponible en S3 para ${language}, pero la duración es 0. Reintentando...`
          );
        }
      } else {
        console.log(
          `Audio no disponible aún para ${language}, reintentando...`
        );
      }
    } catch (error) {
      console.log(
        `Error durante la espera del audio en ${language}, reintentando...`
      );
    }
  }
}

async function generateAudioForLanguage(
  placeId: string,
  mediaId: string,
  language: Languages,
  input: string
) {
  const provider = PROVIDERS_BY_LANGUAGE[language];
  if (provider === "openai") {
    await generateAudioForLanguageOpenAI(placeId, mediaId, language, input);
  } else if (provider === "aws") {
    await generateAudioForLanguageAWS(placeId, mediaId, language, input);
  } else {
    throw new ApolloError("Unsupported provider", "UNSUPPORTED_PROVIDER");
  }
}

async function createFullMedia(placeId: string, media: any) {
  try {
    const place = await MongoPlaceModel.findById(placeId);
    if (!place) {
      throw new ApolloError("Place not found", "PLACE_NOT_FOUND");
    }

    const rating = randomRating();
    const languages = Object.keys(media.title) as Languages[];

    let mediaModel = new MongoMediaModel({
      placeId,
      rating,
      title: media.title,
      text: media.text,
      voiceId: {},
      url: {},
      duration: {},
      type: "audio",
      format: AUDIO_FORMAT,
    });

    await mediaModel.save();

    for (const language of languages) {
      await generateAudioForLanguage(
        placeId,
        mediaModel.id,
        language,
        media.text[language]
      );
    }

    const updatedDoc = await MongoMediaModel.findById(mediaModel._id);
    if (!updatedDoc) {
      throw new ApolloError(
        "Media document not found after updates",
        "NOT_FOUND"
      );
    }
    return updatedDoc.toObject();
  } catch (error) {
    console.log("Error creating media:", error);

    return null;
  }
}

async function AddMediasScript() {
  const mediasSliced = medias.slice(0);
  if (REMOVE_OLD_MEDIAS) {
    const allPlaces = mediasSliced.reduce((acc: string[], media) => {
      if (!acc.includes(media.placeId)) {
        acc.push(media.placeId);
      }
      return acc;
    }, []);
    const allMedias = await MongoMediaModel.find({
      placeId: { $in: allPlaces },
    });
    for (const media of allMedias) {
      const filter = { _id: media._id };
      const update = { deleted: true };
      await MongoMediaModel.findOneAndUpdate(filter, update, {
        new: true,
        useFindAndModify: false,
      });
    }
    console.log("Old medias removed");
  }
  console.log("Start creating medias");

  let mediasCreated = 0;

  for (let i = 0; i < mediasSliced.length; i += BATCH_SIZE) {
    const chunk = mediasSliced.slice(i, i + BATCH_SIZE);
    console.log(
      `Processing batch ${i / BATCH_SIZE + 1} of ${Math.ceil(
        mediasSliced.length / BATCH_SIZE
      )}...`
    );

    const promises = chunk.map((media) =>
      createFullMedia(media.placeId, media)
    );

    try {
      await Promise.all(promises);
      const successfulCreationsInBatch = promises.length;
      mediasCreated += successfulCreationsInBatch;
      console.log(
        `Batch ${
          i / BATCH_SIZE + 1
        } processed. Medias created so far: ${mediasCreated} / ${
          mediasSliced.length
        }`
      );
    } catch (error) {
      console.error(`Error processing batch starting at index ${i}:`, error);
    }
  }

  console.log("Finished creating medias.");
}

export default AddMediasScript();
