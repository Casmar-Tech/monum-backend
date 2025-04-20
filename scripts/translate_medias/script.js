const { OpenAI } = require('openai');
const fs = require('node:fs');

// Configuración de la API de DeepSeek
const apiKey = process.env.DEEPSEEK_API_KEY;
const openai = new OpenAI({
	baseURL: 'https://api.deepseek.com',
	apiKey: apiKey,
	temperature: 1.3,
});

const languageMap = {
	es_ES: 'español',
	en_US: 'inglés',
	fr_FR: 'francés',
	ca_ES: 'catalán',
};

async function translateObject(inputText, language) {
	try {
		const completion = await openai.chat.completions.create({
			model: 'deepseek-chat',
			messages: [
				{
					role: 'system',
					content: `Eres un traductor profesional. Traduce del español al ${language} de manera precisa y natural.`,
				},
				{
					role: 'user',
					content: `Traduce el siguiente texto de español al ${language}. Solo necesito la traducción sin explicaciones adicionales: "${inputText}"`,
				},
			],
			temperature: 0.5,
			max_tokens: 4096,
		});

		return completion.choices[0].message.content.trim();
	} catch (apiError) {
		console.error('Error calling DeepSeek API:', apiError);
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
