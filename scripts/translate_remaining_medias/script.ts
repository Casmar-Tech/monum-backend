import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

interface MediaObject {
  placeId: string;
  title: {
    [langCode: string]: string | null;
  };
  text: {
    [langCode: string]: string | null;
  };
}

// Crear lotes de objetos
const BATCH_SIZE = 10;

// Configuración de la API de Gemini
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey,
});

const languageMap: Record<string, string> = {
  es_ES: "español",
  en_US: "inglés",
  fr_FR: "francés",
  ca_ES: "catalán",
};

async function translateText(
  inputText: string,
  targetLanguage: string
): Promise<string | null> {
  try {
    const model = "gemini-2.0-flash-lite";

    const response = await ai.models.generateContent({
      model,
      contents: inputText,
      config: {
        temperature: 0.5,
        maxOutputTokens: 4096,
        systemInstruction: `Eres un traductor profesional. Traduce del español al ${targetLanguage} de manera precisa y natural. Solo necesito la traducción sin explicaciones adicionales:`,
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

async function processObjectTranslations(
  obj: MediaObject,
  index: number,
  total: number
): Promise<{ object: MediaObject; translationsFixed: number }> {
  console.log(`Analizando objeto ${index + 1}/${total}`);
  let objectModified = false;
  let translationsFixed = 0;

  // Revisar los campos title y text
  for (const field of ["title", "text"] as const) {
    if (!obj[field]) {
      console.log(
        `El objeto ${index + 1} no tiene el campo ${field}, continuando...`
      );
      continue;
    }

    // Obtener el texto en español como base
    const spanishText = obj[field]["es_ES"];
    if (!spanishText) {
      console.log(
        `Advertencia: El objeto ${
          index + 1
        } no tiene texto en español para el campo ${field}.`
      );
      continue;
    }

    // Revisar cada idioma
    for (const langCode in languageMap) {
      // Si no es español y la traducción es null, traducir
      if (
        langCode !== "es_ES" &&
        (obj[field][langCode] === null || obj[field][langCode] === undefined)
      ) {
        console.log(
          `Traduciendo ${field} al ${languageMap[langCode]} para el objeto ${
            index + 1
          }...`
        );

        try {
          const translation = await translateText(
            spanishText,
            languageMap[langCode]
          );

          if (translation) {
            obj[field][langCode] = translation;
            objectModified = true;
            translationsFixed++;
            console.log(`✅ Traducción completada exitosamente.`);
          } else {
            console.error(
              `❌ Error al traducir ${field} al ${languageMap[langCode]}.`
            );
          }

          // Pequeña pausa para no sobrecargar la API
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Error durante la traducción: ${error}`);
        }
      }
    }
  }

  return { object: obj, translationsFixed };
}

async function processBatch(
  batch: MediaObject[],
  startIndex: number,
  totalObjects: number
): Promise<{ objects: MediaObject[]; totalFixed: number }> {
  const results = await Promise.all(
    batch.map((obj, idx) =>
      processObjectTranslations(obj, startIndex + idx, totalObjects)
    )
  );

  const processedObjects = results.map((result) => result.object);
  const totalFixed = results.reduce(
    (sum, result) => sum + result.translationsFixed,
    0
  );

  return { objects: processedObjects, totalFixed };
}

async function processRemainingTranslations(): Promise<void> {
  try {
    // Leer el archivo con las traducciones parciales
    console.log("Leyendo archivo medias-translated.json...");
    const inputData = fs.readFileSync("medias-translated.json", "utf8");
    const jsonData = JSON.parse(inputData);

    // Verificar si es un array o un objeto simple
    const objectsToProcess: MediaObject[] = Array.isArray(jsonData)
      ? jsonData
      : [jsonData];

    console.log(
      `Procesando ${objectsToProcess.length} objetos para completar traducciones faltantes...`
    );

    let totalTranslationsFixed = 0;

    const batches: MediaObject[][] = [];

    for (let i = 0; i < objectsToProcess.length; i += BATCH_SIZE) {
      batches.push(objectsToProcess.slice(i, i + BATCH_SIZE));
    }

    // Procesar cada lote secuencialmente
    for (let i = 0; i < batches.length; i++) {
      console.log(`Procesando lote ${i + 1}/${batches.length}`);

      // Procesar este lote de objetos concurrentemente
      const startIndex = i * BATCH_SIZE;
      const { objects, totalFixed } = await processBatch(
        batches[i],
        startIndex,
        objectsToProcess.length
      );

      // Actualizar los objetos en el array original
      for (let j = 0; j < objects.length; j++) {
        objectsToProcess[startIndex + j] = objects[j];
      }

      totalTranslationsFixed += totalFixed;

      // Guardar resultados parciales después de cada lote
      fs.writeFileSync(
        "fixed-medias-translated.json",
        JSON.stringify(objectsToProcess, null, 2),
        "utf8"
      );

      console.log(
        `Lote ${
          i + 1
        } completado. Traducciones fijas en este lote: ${totalFixed}`
      );
      console.log(`Progreso guardado en fixed-medias-translated.json`);
    }

    console.log("==========================================");
    console.log("Proceso completado.");
    console.log(
      `Se han corregido ${totalTranslationsFixed} traducciones faltantes.`
    );
    console.log(
      `Todos los datos han sido guardados en: fixed-medias-translated.json`
    );
  } catch (error) {
    console.error("Error procesando el archivo JSON:", error);
  }
}

// Ejecutar el programa
processRemainingTranslations();
