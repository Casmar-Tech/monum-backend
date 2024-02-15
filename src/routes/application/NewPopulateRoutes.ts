import "../../connection.js";
import { MongoPlaceModel } from "../../places/infrastructure/mongoModel/MongoPlaceModel.js";
import { MongoCityModel } from "../../cities/infrastructure/mongoModel/MongoCityModel.js";
import OpenAI from "openai";

const openai = new OpenAI();

async function NewPopulateRoutes(cityId: string, topic: string, stops: number) {
  const city = await MongoCityModel.findById(cityId);
  if (!city) {
    throw new Error("City not found");
  }
  const places = await MongoPlaceModel.find({
    "address.city.en_US": city.translations.en_US,
  });
  if (places.length === 0) {
    throw new Error("No places found");
  }
  const routeString = await openai.chat.completions.create({
    model: "gpt-3.5-turbo-1106",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant designed to output JSON.",
      },
      {
        role: "user",
        content: `I want you to make me a route of ${
          stops || "10"
        } stops in the city of ${
          city.translations.en_US
        } related to the topic ${topic}.
        To make this route you have available the following monuments or places of interest, none more.
        ${places.map((place) => place.name).join(", ")}
        I want you to choose ${
          stops || "10"
        } of these that I have sent you and send me back the "title" of the route and the "placeList" with a list of the places you have chosen (with the exact same name that I have sent you so that I can make a match).`,
      },
    ],
  });
  const { title, placeList } = JSON.parse(
    routeString.choices[0].message?.content || ""
  );
  console.log({ title, placeList });
}

NewPopulateRoutes("6515466b72014842c0a63567", "history", 5);
