const { GoogleGenAI } = require('@google/genai');
const fs = require('node:fs');

// Configuración de la API de Gemini
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey,
});

const languageMap = {
  es_ES: 'español',
  en_US: 'inglés',
  fr_FR: 'francés',
  ca_ES: 'catalán',
};

async function translateObject(inputText, language) {
  try {
    const model =  'gemini-2.0-flash-lite';


    const response = await ai.models.generateContent({
			model,
      contents: inputText,
      config: {
      temperature: 0.5,
      maxOutputTokens: 4096,
			systemInstruction: `Eres un traductor profesional. Traduce del español al ${language} de manera precisa y natural. Solo necesito la traducción sin explicaciones adicionales:`,
    	responseMimeType: 'text/plain',
    }
    });

		return response.text;
  } catch (apiError) {
    console.error('Error calling Gemini API:', apiError);
    return null;
  }
}

async function processJsonFile() {
  try {
    // Leer el archivo de entrada
    const inputData = fs.readFileSync('medias.json', 'utf8');
    const jsonData = JSON.parse(inputData);

    // Verificar si es un array o un objeto simple
    const objectsToProcess = Array.isArray(jsonData) ? jsonData : [jsonData];

    // Array para almacenar los resultados traducidos
    const translatedResults = [];

    // Procesar cada objeto uno por uno
    console.log(`Procesando ${objectsToProcess.length} objetos...`);

    const allLanguages = Object.keys(languageMap);

    for (let i = 0; i < objectsToProcess.length; i++) {
      const obj = objectsToProcess[i];
      console.log(
        `Procesando objeto ${i + 1}/${objectsToProcess.length}: ${
          obj.title ? obj.title.substring(0, 30) + '...' : 'Sin título'
        }`,
      );

      const translatedObject = {};
      // Traducir el objeto
      for (const key of ['title', 'text']) {
        translatedObject.placeId = obj.placeId;
        for (const langCode of allLanguages) {
          const langName = languageMap[langCode];

          // Si es español, no necesitamos traducir, solo usar el original
          if (langCode === 'es_ES') {
            translatedObject[key] = {
              ...translatedObject[key],
              [langCode]: obj[key],
            };
            continue;
          }

          const translation = await translateObject(obj[key], langName);
          translatedObject[key] = {
            ...translatedObject[key],
            [langCode]: translation,
          };
        }
      }

      if (translatedObject) {
        translatedResults.push(translatedObject);

        // Guardar resultados parciales después de cada traducción exitosa
        fs.writeFileSync(
          'medias-translated.json',
          JSON.stringify(translatedResults, null, 2),
          'utf8',
        );

        console.log(`Objeto ${i + 1} traducido y guardado.`);
      } else {
        console.error(`Error al traducir el objeto ${i + 1}.`);
      }

      // Esperar un breve momento entre llamadas para no sobrecargar la API
      if (i < objectsToProcess.length - 1) {
        console.log('Esperando antes de la siguiente traducción...');
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log('Proceso completado.');
    console.log(
      `Se han traducido ${translatedResults.length} de ${objectsToProcess.length} objetos.`,
    );
    console.log(`Resultados guardados en: medias-translated.json`);
  } catch (error) {
    console.error('Error procesando el archivo JSON:', error);
  }
}

// Ejecutar el programa
processJsonFile();
