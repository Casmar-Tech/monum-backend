import { Configuration, OpenAIApi } from "openai";
import { Photo as PexelsPhoto, createClient } from "pexels";
import PopulateMediaUseCase from "../../medias/application/PopulateMediaByNumberUseCase.js";
import Photo from "../domain/valueObjects/Photo.js";
import { MongoPlaceModel } from "../infrastructure/mongoModel/MongoPlaceModel.js";

interface PopulatePlaceByNameDTO {
  name: string; // Name of the place of interest I want to add
  addMedia?: boolean;
}

export default async function PopulatePlaceByNameUseCase({
  name,
  addMedia,
}: PopulatePlaceByNameDTO) {
  try {
    const configuration = new Configuration({
      organization: process.env.OPENAI_ORGANIZATION_ID!,
      apiKey: process.env.OPENAI_API_KEY!,
    });
    const openai = new OpenAIApi(configuration);
    const pexelsClient = createClient(process.env.PEXELS_API_KEY!);
    const placeString = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `I want to populate my MongoDB database. This database has to contain some places of interest. For this reason, I ask you to return me all the info of the place of interest / monument with the name: ${name}.
            The structure of the object you have to return must be like:
            {
              "name": <string> (name of the place of interest that i said before),
              "address": {
                "coordinates": {
                  "lat": <number>,
                  "lng": <number>
                },
                "street": <string>,
                "city": <string>,
                "postalCode": <string>,
                "province": <string>,
                "country": <string>,
              },
              "importance": <number> (integer between 0-10 specifing the importance of the monument in the city),
              "rating": <number> (random float between 0-5 with 2 decimal places, for example: 3.67),
              "description": <string> (Summary description of the monument of about 200 characters approximately)
            }
            The answer you have to give me must be convertible into a JSON object directly with the JSON.parse() function so that I can insert it directly into my database. Therefore, you only have to give me back what I ask you (without any introduction or additional text) only what I have asked you strictly.`,
        },
      ],
    });
    const place = JSON.parse(
      placeString.data.choices[0].message?.content || ""
    );
    const photos: any = await pexelsClient.photos.search({
      query: place.name,
      per_page: 5,
    });
    if (Array.isArray(photos.photos)) {
      place.photos = photos.photos.map(
        (photo: PexelsPhoto) =>
          new Photo({
            pexelsId: photo.id.toString(),
            width: photo.width,
            height: photo.height,
            url: photo.src.original,
          })
      );
    }
    const placeCreated = await MongoPlaceModel.create(place);
    if (placeCreated._id && addMedia) {
      await PopulateMediaUseCase({
        placeId: placeCreated._id.toString(),
        number: 10,
        language: "en-US",
      });
    }
    return placeCreated;
  } catch (error) {
    console.log("Error", error);
    throw error;
  }
}
