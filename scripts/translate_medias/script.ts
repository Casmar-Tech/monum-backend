import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

// Tipos de datos
interface MediaObject {
  placeId: string;
  title: string;
  text: string;
}

interface TranslatedObject {
  placeId: string;
  title: {
    [langCode: string]: string;
  };
  text: {
    [langCode: string]: string;
  };
}

// Configuración de la API de Gemini
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey,
});

const BATCH_SIZE = 10;

const languageMap: Record<string, string> = {
  es_ES: "español",
  en_US: "inglés",
  fr_FR: "francés",
  ca_ES: "catalán",
};

async function translateObject(
  inputText: string,
  language: string
): Promise<string | null> {
  try {
    const model = "gemini-2.0-flash-lite";

    const response = await ai.models.generateContent({
      model,
      contents: inputText,
      config: {
        temperature: 0.5,
        maxOutputTokens: 4096,
        systemInstruction: `Eres un traductor profesional. Traduce del español al ${language} de manera precisa y natural. Solo necesito la traducción sin explicaciones adicionales:`,
        responseMimeType: "text/plain",
      },
    });

    if (!response || !response.text) {
      console.error("No se recibió respuesta de la API de Gemini");
      return null;
    }

    return response.text;
  } catch (apiError) {
    console.error("Error calling Gemini API:", apiError);
    return null;
  }
}

async function translateMediaObject(
  obj: MediaObject
): Promise<TranslatedObject> {
  const translatedObject: TranslatedObject = {
    placeId: obj.placeId,
    title: {},
    text: {},
  };

  const allLanguages = Object.keys(languageMap);

  for (const key of ["title", "text"] as const) {
    for (const langCode of allLanguages) {
      const langName = languageMap[langCode];

      // Si es español, no necesitamos traducir, solo usar el original
      if (langCode === "es_ES") {
        translatedObject[key][langCode] = obj[key];
        continue;
      }

      const translation = await translateObject(obj[key], langName);
      if (translation) {
        translatedObject[key][langCode] = translation;
      }
    }
  }

  return translatedObject;
}

async function processBatch(
  batch: MediaObject[],
  translatedResults: TranslatedObject[]
): Promise<TranslatedObject[]> {
  const batchResults = await Promise.all(
    batch.map(async (obj, index) => {
      console.log(
        `Procesando objeto ${index + 1}/${batch.length}: ${
          obj.title ? obj.title.substring(0, 30) + "..." : "Sin título"
        }`
      );

      return translateMediaObject(obj);
    })
  );

  return [...translatedResults, ...batchResults];
}

async function processJsonFile(): Promise<void> {
  try {
    // Leer el archivo de entrada
    const inputData = fs.readFileSync("medias.json", "utf8");
    const jsonData = JSON.parse(inputData);

    // Verificar si es un array o un objeto simple
    const objectsToProcess: MediaObject[] = Array.isArray(jsonData)
      ? jsonData
      : [jsonData];

    // Array para almacenar los resultados traducidos
    let translatedResults: TranslatedObject[] = [];

    console.log(
      `Procesando ${objectsToProcess.length} objetos en grupos de ${BATCH_SIZE}...`
    );

    // Crear lotes de BATCH_SIZE objetos
    const batches: MediaObject[][] = [];

    for (let i = 0; i < objectsToProcess.length; i += BATCH_SIZE) {
      batches.push(objectsToProcess.slice(i, i + BATCH_SIZE));
    }

    // Procesar cada lote secuencialmente
    for (let i = 0; i < batches.length; i++) {
      console.log(`Procesando lote ${i + 1}/${batches.length}`);

      // Procesar este lote de objetos concurrentemente
      translatedResults = await processBatch(batches[i], translatedResults);

      // Guardar resultados parciales
      fs.writeFileSync(
        "medias-translated.json",
        JSON.stringify(translatedResults, null, 2),
        "utf8"
      );

      console.log(
        `Lote ${i + 1} completado. Total objetos traducidos hasta ahora: ${
          translatedResults.length
        }`
      );

      // Esperar un momento entre lotes
      if (i < batches.length - 1) {
        console.log("Esperando antes del siguiente lote...");
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log("Proceso completado.");
    console.log(
      `Se han traducido ${translatedResults.length} de ${objectsToProcess.length} objetos.`
    );
    console.log(`Resultados guardados en: medias-translated.json`);
  } catch (error) {
    console.error("Error procesando el archivo JSON:", error);
  }
}

// Ejecutar el programa
processJsonFile();
