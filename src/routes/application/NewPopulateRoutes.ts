import "../../connection.js";
import { MongoRouteModel } from "../infrastructure/mongoModel/MongoRouteModel.js";
import { MongoPlaceModel } from "../../places/infrastructure/mongoModel/MongoPlaceModel.js";
import { MongoCityModel } from "../../cities/infrastructure/mongoModel/MongoCityModel.js";
import { MongoMediaModel } from "../../medias/infrastructure/mongoModel/MongoMediaModel.js";
import { IStop } from "../domain/interfaces/IStop.js";
import OpenAI from "openai";

const openai = new OpenAI();

async function NewPopulateRoutes(
  cityId: string,
  topic: string,
  stopsNumber: number
) {
  try {
    const city = await MongoCityModel.findById(cityId);
    if (!city) {
      throw new Error("City not found");
    }
    const places = await MongoPlaceModel.aggregate([
      {
        $match: {
          deleted: { $ne: true },
          "address.city.en_US": city.translations.en_US,
        },
      },
      {
        $lookup: {
          from: "medias", // Asegúrate de que el nombre de la colección es correcto
          localField: "_id",
          foreignField: "placeId",
          as: "mediaDocs",
        },
      },
      {
        $addFields: {
          mediaCount: { $size: "$mediaDocs" },
        },
      },
      {
        $match: {
          mediaCount: { $gt: 3 },
        },
      },
      {
        $project: {
          mediaDocs: 0,
          mediaCount: 0,
        },
      },
    ]);
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
            stopsNumber || "10"
          } stops in the city of ${
            city.translations.en_US
          } related to the topic ${topic}.
        To make this route you have available the following monuments or places of interest, none more.
        ${places.map((place) => place.name).join(", ")}
        I want you to choose ${
          stopsNumber || "10"
        } of these that I have sent you and send me back the "title" and the "description of the route and the "placeList" with a list of the places you have chosen (with the exact same name that I have sent you so that I can make a match).`,
        },
      ],
    });
    const { title, description, placeList } = JSON.parse(
      routeString.choices[0].message?.content || ""
    );

    const allPlaces = places.filter((place) => placeList.includes(place.name));

    const stops: IStop[] = [];
    let index = 0;
    for (const place of allPlaces) {
      const mediasOfPlace = await MongoMediaModel.find({ placeId: place._id });
      const mediaString = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-1106",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant designed to output JSON.",
          },
          {
            role: "user",
            content: `I have all these text titles related to ${
              place.name
            } in the city of ${city.translations.en_US}: ${mediasOfPlace
              .map((media) => media.title.en_US)
              .join(", ")}.
            I want you to choose the 2 or 3 titles that best represent the topic and return them to me as an array with the property "choosenTitles".
            I want you to return me only the property "choosenTitles"`,
          },
        ],
      });
      const { choosenTitles } = JSON.parse(
        mediaString.choices[0].message?.content || ""
      );
      const medias = mediasOfPlace.filter((media) =>
        choosenTitles.includes(media.title.en_US)
      );
      if (medias.length === 0) {
        throw new Error("No medias found");
      }
      stops.push({
        order: index,
        place,
        medias,
      });
      index++;
    }
    const createdRoute = await MongoRouteModel.create({
      title: {
        "en-US": title,
      },
      description: {
        "en-US": description,
      },
      stops,
      rating: parseFloat((Math.random() * 2 + 3).toFixed(2)),
      cityId: city._id,
    });
    console.log("Route created: ", createdRoute.id);
  } catch (error) {
    console.log(error);
  }
}

NewPopulateRoutes("6515466b72014842c0a63567", "history", 5);
