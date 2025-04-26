import { OpenAI } from "openai";
import * as fs from "node:fs";
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

// Types definitions
interface Place {
  _id: {
    $oid: string;
  };
  name: string;
  importance?: number;
}

interface TitleAndBeginning {
  title: string;
  beginning: string;
}

interface AudioGuide {
  placeId: string;
  title: string;
  text: string;
}

// DeepSeek API Configuration
const apiKey = process.env.DEEPSEEK_API_KEY!;
const openai = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey,
});

const BATCH_SIZE = 50;

// Prompt to generate audio guide titles and initial words
const TITLES_PROMPT = `Eres un guía turistico professional. He creado una app para descubrir y explorar ciudades y sus monumentos o lugares de interes turistico y cultural. Tu objetivo es crear audioguías en español para los monumentos. Ahora mismo solo necesito que me generes una lista de títulos atractivos para audioguías junto con las primeras 20 palabras aproximadamente de cada audioguía.

Requisitos para los títulos:
- Deben ser atractivos y despertar curiosidad
- Adaptados a tendencias actuales como en YouTube o blogs
- No deben ser muy largos pero sí explicativos del contenido
- Centrados en el contenido específico que tratará la audioguía
- Cada título debe relacionarse con un tema distinto del monumento (historia, personajes, arte, simbolismo, etc.)

Requisitos para los inicios (primeras 20 palabras):
- Deben ser diferentes entre sí, con variedad de estilos
- Deben ser atractivos y enganchantes
- No necesitan presentar el monumento directamente
- Pueden comenzar con datos históricos, anécdotas o curiosidades
- Deben estar escritos para ser escuchados, en primera persona

Por favor, genera exactamente el número de títulos e inicios que te pida para el monumento específico.
Devuélveme la respuesta en formato JSON así:
[
  { "title": "Título 1", "beginning": "Inicio de aproximadamente 20 palabras para la audioguía 1..." },
  { "title": "Título 2", "beginning": "Inicio de aproximadamente 20 palabras para la audioguía 2..." }
]

Solo quiero el JSON como respuesta, nada más.`;

// Prompt to generate full audio guides based on title and beginning
const FULL_AUDIOGUIDE_PROMPT = `Eres un guía turistico professional. He creado una app para descubrir y explorar ciudades y sus monumentos. Tu objetivo es crear una audioguía en español basada en el título e inicio que te proporcionaré.

La audioguía debe seguir estos requisitos:
- Duración: Entre 300 y 500 palabras en total
- Debe comenzar EXACTAMENTE con las palabras iniciales que te daré
- Debe mantener el tono y temática sugeridos por el título y el inicio
- Lenguaje moderno pero profesional, adaptado a los tiempos actuales
- Tono narrativo que enganche al oyente sin perder formalidad y rigor
- Priorizar información histórica y trascendencia cultural del monumento
- Incluir detalles sobre arte, arquitectura y personajes relacionados
- Añadir curiosidades y anécdotas interesantes
- Precisión y rigor: proporcionar datos y fechas solo si estás 100% seguro
- Formato para ser leído en voz alta (convertido a audio)
- Escrito en primera persona, dirigiéndose al oyente de manera cercana
- No presentarte ni hacer referencias a que eres una guía o narrador

Devuélveme solo la audioguía completa en formato JSON así:
{
  "title": "TÍTULO QUE TE PROPORCIONARÉ",
  "text": "TEXTO COMPLETO DE LA AUDIOGUÍA INCLUYENDO EL INICIO PROPORCIONADO"
}

Solo quiero el JSON, nada más.`;

/**
 * Generates titles and initial words for multiple audio guides for a specific place
 */
async function generateTitlesAndBeginnings(
  place: Place,
  numGuides: number
): Promise<TitleAndBeginning[]> {
  try {
    // Extract place information
    const name = place.name || "";

    console.log(`\n--------------------------`);
    console.log(`PLACE: ${name}`);
    console.log(`--------------------------`);

    // Create specific prompt for this request
    const prompt = `${name} - ${numGuides} títulos e inicios de audioguías`;

    // Call DeepSeek API
    const completion = await openai.chat.completions.create({
      model: "deepseek-reasoner",
      messages: [
        {
          role: "system",
          content: TITLES_PROMPT,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 2000,
      temperature: 1.3,
    });

    // Extract response and parse as JSON
    const response = completion?.choices?.[0]?.message?.content?.trim();

    // Try to parse the response as JSON
    let titlesAndBeginnings: TitleAndBeginning[];
    try {
      // Look for JSON array in the response
      const jsonMatch = response?.match(/\[\s*\{.*\}\s*\]/s);
      if (jsonMatch) {
        titlesAndBeginnings = JSON.parse(jsonMatch[0]);
      } else {
        // If no clear JSON pattern is found, try parsing the entire response
        titlesAndBeginnings = response && JSON.parse(response);
      }
    } catch (parseError) {
      console.error("Error parsing JSON from response:", parseError);
      console.log("Received response:", response);
      return [];
    }

    return titlesAndBeginnings;
  } catch (error) {
    console.error("Error generating titles and beginnings:", error);
    return [];
  }
}

/**
 * Generates a full audio guide based on title and beginning
 */
async function generateFullAudioguide(
  place: Place,
  titleAndBeginning: TitleAndBeginning
): Promise<AudioGuide | null> {
  try {
    const name = place.name || "";
    const { title, beginning } = titleAndBeginning;

    // Create specific prompt for this request
    const prompt = `Monumento: ${name}\nTítulo: ${title}\nInicio: ${beginning}`;

    // Call DeepSeek API
    const completion = await openai.chat.completions.create({
      model: "deepseek-reasoner",
      messages: [
        {
          role: "system",
          content: FULL_AUDIOGUIDE_PROMPT,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 3000,
    });

    // Extract response and parse as JSON
    const response = completion?.choices?.[0]?.message?.content?.trim();

    // Try to parse the response as JSON with enhanced error handling
    let audioguide: { title: string; text: string };
    try {
      // First attempt: Try to find JSON pattern and clean it
      const jsonMatch = response?.match(/\{\s*"title".*"text".*\}/s);
      if (jsonMatch) {
        // Clean the JSON string by handling special characters and control characters
        const cleanedJson = jsonMatch[0]
          .replace(/[\n\r]/g, "\\n") // Replace newlines with escaped newlines
          .replace(/\*/g, "\\*") // Escape asterisks
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, ""); // Remove control characters

        try {
          audioguide = JSON.parse(cleanedJson);
        } catch (innerError) {
          // If that fails, try a more aggressive approach: Extract manually
          console.log(
            "First clean parsing failed, trying alternative method..."
          );

          // Extract title and text manually using regex
          const titleMatch = response?.match(/"title":\s*"([^"]+)"/);
          const textMatch = response?.match(/"text":\s*"([\s\S]+?)"\s*\}/);

          if (titleMatch && textMatch) {
            audioguide = {
              title: titleMatch[1],
              text: textMatch[1].replace(/\\"/g, '"').replace(/\\n/g, "\n"),
            };
          } else {
            throw new Error("Could not extract title and text from response");
          }
        }
      } else {
        // If no JSON pattern is found, try to clean the entire response
        const cleanedFullResponse = response
          ?.replace(/```json\s*/g, "") // Remove ```json
          ?.replace(/\s*```/g, "") // Remove closing ```
          ?.replace(/[\n\r]/g, "\\n") // Replace newlines with escaped newlines
          ?.replace(/\*/g, "\\*") // Escape asterisks
          ?.replace(/[\u0000-\u001F\u007F-\u009F]/g, ""); // Remove control characters

        audioguide = cleanedFullResponse && JSON.parse(cleanedFullResponse);
      }

      // Log successful parse
      console.log(`Successfully parsed guide: "${audioguide.title}"`);
      // No individual text files, just log success
      console.log(
        `Guide successfully processed and will be added to JSON file`
      );
    } catch (parseError) {
      console.error("Error parsing JSON from response:", parseError);
      console.log("Received response:", response);
      return null;
    }

    // Add place ID to the audio guide
    return {
      placeId: place._id.$oid,
      title: audioguide.title,
      text: audioguide.text,
    };
  } catch (error) {
    console.error("Error generating full audio guide:", error);
    return null;
  }
}

/**
 * Generates multiple audio guides for a place using the two-step process
 */
async function generateAudioguides(
  place: Place,
  numGuides: number
): Promise<AudioGuide[]> {
  const guides: AudioGuide[] = [];

  // Step 1: Generate titles and beginnings for all guides
  console.log(
    `Generating ${numGuides} titles and beginnings for ${place.name}`
  );
  const titlesAndBeginnings = await generateTitlesAndBeginnings(
    place,
    numGuides
  );

  if (!titlesAndBeginnings || titlesAndBeginnings.length === 0) {
    console.error(`Failed to generate titles and beginnings for ${place.name}`);
    return guides;
  }

  console.log(
    `Successfully generated ${titlesAndBeginnings.length} titles and beginnings`
  );

  // Step 2: Generate full guides based on titles and beginnings
  for (let i = 0; i < titlesAndBeginnings.length; i++) {
    const titleAndBeginning = titlesAndBeginnings[i];
    console.log(
      `Generating full guide ${i + 1}/${titlesAndBeginnings.length} for ${
        place.name
      }`
    );
    console.log(`Title: "${titleAndBeginning.title}"`);
    console.log(`Beginning: "${titleAndBeginning.beginning}"`);

    const guide = await generateFullAudioguide(place, titleAndBeginning);

    if (guide) {
      guides.push(guide);
      console.log(`Guide ${i + 1} generated successfully`);
      console.log(`\nNEW GUIDE DETAILS:`);
      console.log(`Title: "${guide.title}"`);
      console.log(
        `Text (first 100 chars): "${guide.text.substring(0, 100)}..."`
      );
      console.log(`Text length: ${guide.text.length} characters`);
    } else {
      console.error(`Failed to generate guide ${i + 1}`);
    }

    // Wait between API calls
    if (i < titlesAndBeginnings.length - 1) {
      console.log("Waiting before next generation...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  return guides;
}

/**
 * Process a batch of places concurrently
 */
async function processPlaceBatch(
  places: Place[],
  allAudioguides: AudioGuide[]
): Promise<AudioGuide[]> {
  const results = await Promise.all(
    places.map(async (place) => {
      console.log(`Processing place: ${place.name}`);
      const placeId = place._id.$oid;

      // Determine how many guides to generate based on importance
      const importance = place.importance || 1;
      let numGuidesNeeded = 3;
      if (importance === 2) {
        numGuidesNeeded = 5;
      }
      if (importance === 3) {
        numGuidesNeeded = 7;
      }

      // Check if we already have enough guides for this place
      const existingGuides = allAudioguides.filter(
        (guide) => guide.placeId === placeId
      );

      if (existingGuides.length >= numGuidesNeeded) {
        console.log(
          `Place ${place.name} already has ${existingGuides.length} guides (needed: ${numGuidesNeeded}). Skipping.`
        );
        return [];
      }

      // If there are some guides but not enough, remove them
      if (
        existingGuides.length > 0 &&
        existingGuides.length < numGuidesNeeded
      ) {
        console.log(
          `Place ${place.name} has ${existingGuides.length} guides but needs ${numGuidesNeeded}. Removing existing guides and generating new ones.`
        );
        // Remove existing guides for this place from allAudioguides
        const guidesToKeep = allAudioguides.filter(
          (guide) => guide.placeId !== placeId
        );
        // Update the global array by reference
        allAudioguides.length = 0;
        allAudioguides.push(...guidesToKeep);
      }

      // Generate guides for this place
      console.log(`Generating ${numGuidesNeeded} guides for ${place.name}`);
      return generateAudioguides(place, numGuidesNeeded);
    })
  );

  // Flatten the results and add to all guides
  const newGuides = results.flat();
  return [...allAudioguides, ...newGuides];
}

/**
 * Process places file and generate audio guides for each place
 */
async function processPlaces(): Promise<void> {
  try {
    // Read places file
    const inputData = fs.readFileSync("places.json", "utf8");
    const places: Place[] = JSON.parse(inputData);

    // Array to store all audio guides
    let allAudioguides: AudioGuide[] = [];

    // Output file
    const outputFile = "medias.json";

    // Check if output file already exists and load existing guides
    if (fs.existsSync(outputFile)) {
      try {
        const existingData = fs.readFileSync(outputFile, "utf8");
        if (existingData && existingData.trim()) {
          allAudioguides = JSON.parse(existingData);
          console.log(`Loaded ${allAudioguides.length} existing audio guides.`);
        }
      } catch (readError) {
        console.warn(
          "Error reading existing file, starting from scratch:",
          readError
        );
      }
    }

    // Process places in batches of BATCH_SIZE
    console.log(
      `Processing ${places.length} places in batches of ${BATCH_SIZE}...`
    );

    // Create batches of BATCH_SIZE places
    const batches: Place[][] = [];

    for (let i = 0; i < places.length; i += BATCH_SIZE) {
      batches.push(places.slice(i, i + BATCH_SIZE));
    }

    // Process each batch sequentially
    for (let i = 0; i < batches.length; i++) {
      console.log(`Processing batch ${i + 1}/${batches.length}`);

      // Process this batch of places concurrently
      allAudioguides = await processPlaceBatch(batches[i], allAudioguides);

      // Save partial results
      fs.writeFileSync(
        outputFile,
        JSON.stringify(allAudioguides, null, 2),
        "utf8"
      );

      console.log(
        `Batch ${i + 1} completed. Total guides so far: ${
          allAudioguides.length
        }`
      );

      // Wait a moment between batches
      if (i < batches.length - 1) {
        console.log("Waiting before the next batch...");
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

    console.log("Process completed.");
    console.log(
      `A total of ${allAudioguides.length} audio guides have been generated.`
    );
    console.log(`Results saved in: ${outputFile}`);
  } catch (error) {
    console.error("Error processing places file:", error);
  }
}

// Execute the program
processPlaces();
