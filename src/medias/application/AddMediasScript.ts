import medias from "./test.medias.json";
import "../../connection.js";
import dotenv from "dotenv";
dotenv.config();
import {
  PollyClient,
  StartSpeechSynthesisTaskCommand,
  DescribeVoicesCommand,
  LanguageCode,
  Engine,
} from "@aws-sdk/client-polly";
import { MongoPlaceModel } from "../../places/infrastructure/mongoModel/MongoPlaceModel.js";
import { MongoMediaModel } from "../infrastructure/mongoModel/MongoMediaModel.js";
import { ApolloError } from "apollo-server-errors";
import { Languages } from "../../shared/Types.js";
import { getMediaDuration } from "../domain/functions/Media.js";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

function randomRating() {
  const min = 3.8;
  const max = 5.0;
  const numero = Math.random() * (max - min) + min;
  return parseFloat(numero.toFixed(2));
}

const REMOVE_OLD_MEDIAS = true;

async function generateAudioForLanguage(
  mediaModel: any, // asegúrate de que este tipo sea un documento de mongoose, por ej: DocumentType<IMedia>
  language: Languages
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

  const s3Key = `${mediaModel.placeId.toString()}/${language}/${mediaModel._id.toString()}`;

  const command = new StartSpeechSynthesisTaskCommand({
    Engine: voicesByLanguage[language].engine as Engine,
    Text: mediaModel.text[language] || "",
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

  const prefix = `${mediaModel.placeId.toString()}/${language}/`;

  // Nuevo enfoque: seguir esperando hasta que haya una duración > 0
  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 10000)); // Esperar 10s

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
        await MongoMediaModel.findByIdAndUpdate(mediaModel._id, update, {
          new: true,
        });

        const duration = await getMediaDuration(
          mediaModel._id.toString(),
          language
        );

        if (duration && duration > 0) {
          console.log(
            `La duración del audio generado en ${language} es de ${duration} segundos`
          );

          const updateDuration = {
            [`duration.${language}`]: Math.floor(duration),
          };
          await MongoMediaModel.findByIdAndUpdate(
            mediaModel._id,
            updateDuration,
            {
              new: true,
            }
          );

          // Duración válida encontrada, salimos del bucle
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

async function createFullMedia(placeId: string, media: any) {
  const place = await MongoPlaceModel.findById(placeId);
  if (!place) {
    throw new ApolloError("Place not found", "PLACE_NOT_FOUND");
  }

  const rating = randomRating();
  const languages = Object.keys(media.title) as Languages[];

  // Crear el documento inicialmente con todos los idiomas en title y text
  // url, voiceId y duration se inicializan como objetos vacíos
  let mediaModel = new MongoMediaModel({
    placeId,
    rating,
    title: media.title,
    text: media.text,
    voiceId: {},
    url: {},
    duration: {},
    type: "audio",
    format: "mp3",
  });

  await mediaModel.save(); // Guardamos el documento con los idiomas, sin audios generados aún

  // Ahora generamos el audio para cada idioma y actualizamos el documento
  for (const language of languages) {
    await generateAudioForLanguage(mediaModel, language);
  }

  // Una vez generados todos los audios, podemos devolver el documento completo
  const updatedDoc = await MongoMediaModel.findById(mediaModel._id);
  if (!updatedDoc) {
    throw new ApolloError(
      "Media document not found after updates",
      "NOT_FOUND"
    );
  }

  // Opcionalmente, puedes devolver el documento ya traducido
  // return await getTranslatedMedia(updatedDoc.toObject(), languages[0]);
  return updatedDoc.toObject();
}

async function AddMediasScript() {
  const mediasSliced = medias.slice(0);
  if (REMOVE_OLD_MEDIAS) {
    debugger;
    const allPlaces = mediasSliced.reduce((acc: string[], media) => {
      if (!acc.includes(media.placeId.$oid)) {
        acc.push(media.placeId.$oid);
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
        new: true, // return the updated document
        useFindAndModify: false, // to use MongoDB driver's findOneAndUpdate() instead of findAndModify()
      });
    }
    console.log("Old medias removed");
  }
  console.log("Start creating medias");

  let mediasToCreate = 0;
  for (const media of mediasSliced) {
    await createFullMedia(media.placeId.$oid, media);
    mediasToCreate++;
    console.log(`Medias created: ${mediasToCreate} / ${mediasSliced.length}`);
  }
}

export default AddMediasScript();
