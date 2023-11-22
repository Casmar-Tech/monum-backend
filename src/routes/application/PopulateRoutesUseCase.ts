import { Configuration, OpenAIApi } from "openai";
import PopulatePlaceByNameUseCase from "../../places/application/PopulatePlaceByNameUseCase.js";
import PopulateMediaByTopicUseCase from "../../medias/application/PopulateMediaByTopicUseCase.js";
import { MongoPlaceModel } from "../../places/infrastructure/mongoModel/MongoPlaceModel.js";
import { MongoMediaModel } from "../../medias/infrastructure/mongoModel/MongoMediaModel.js";
import { MongoRouteModel } from "../infrastructure/mongoModel/MongoRouteModel.js";
import { ApolloError } from "apollo-server-errors";
import { getTrip } from "../infrastructure/osrm/GetTrip.js";
import { getRoute } from "../infrastructure/osrm/GetRoute.js";
import { MongoCityModel } from "../../cities/infrastructure/mongoModel/MongoCityModel.js";
import CreateCityByEnglishNameUseCase from "../../cities/application/CreateCityByEnglishNameUseCase.js";

interface PopulateRoutesDTO {
  place: string; // Normally will be the city, zone or neighborhood
  topic: string;
  stops?: number; // The number of new we want to add (1 if not specified)
  number?: number;
}

interface RouteJson {
  title: string;
  description: string;
  rating: number;
  stops: Array<{
    name: string;
  }>;
}

export default async function PopulateRoutesUseCase({
  place,
  topic,
  stops = 3,
  number = 1,
}: PopulateRoutesDTO) {
  try {
    const configuration = new Configuration({
      organization: process.env.OPENAI_ORGANIZATION_ID || "",
      apiKey: process.env.OPENAI_API_KEY || "",
    });
    const openai = new OpenAIApi(configuration);
    const routesString = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `I want to populate my MongoDB database. This database has to contain routes with the most important places of interest in a zone, neighborhood, city, region or country. For this reason, I ask you to return me a list of ${number} possible routes related with the following topic: ${topic}. So it must be an array! The routes must have ${stops} stops that are monuments or places of interest to visit of the region/zone ${place}.
            The structure of the objects that compose my database is the following:
            {
              "title": <string> (name of the route, should be a bit inspirational),
              "description": <string> (Summary description of the route of about 200 characters approximately),
              "rating": <number> (random float between 0-5 with 2 decimal places, for example: 3.67),
              "stops": Array<{"name": <string> (name of the place of interest)}> (it must be an array whit ${stops} elements and none of them can be repeated)
            }
            The answer you have to give me must be convertible into a JSON directly with the JSON.parse() function so that I can insert it directly into my database. Therefore, you only have to give me back what I ask you (without any introduction or additional text) only what I have asked you strictly.`,
        },
      ],
    });
    const routesJSON = JSON.parse(
      routesString.data.choices[0].message?.content || ""
    );
    if (!Array.isArray(routesJSON)) {
      throw new ApolloError(
        "Response from OpenAI is not in the format we were expecting",
        "OPEN_AI_RESPONSE_BAD_FORMAT"
      );
    }
    return await Promise.all(
      routesJSON.map(async (route: RouteJson) => {
        if (Array.isArray(route.stops)) {
          const allMedias = await Promise.all(
            route.stops.map(async (stop) => {
              try {
                let place = await MongoPlaceModel.findOne({
                  name: stop.name,
                });
                if (!place) {
                  // Si no existe el Place lo creamos desde 0 y le añadimos 1 audio del mismo topico
                  place = await PopulatePlaceByNameUseCase({
                    name: stop.name,
                  });
                  return PopulateMediaByTopicUseCase({
                    placeId: place._id.toString(),
                    topic,
                  });
                }
                // En caso que exista miramos si tiene 5 o más audios y si no creamos 1 y lo devolvemos.
                const medias = await MongoMediaModel.find({
                  "place._id": place._id.toString(),
                });
                if (medias.length < 1) {
                  return PopulateMediaByTopicUseCase({
                    placeId: place._id.toString(),
                    topic,
                  });
                }
                const mediaSelectedString = await openai.createChatCompletion({
                  model: "gpt-3.5-turbo",
                  messages: [
                    {
                      role: "user",
                      content: `I want to populate my MongoDB database.
                          My data is this array of strings: [${medias.map(
                            (media) => media.title
                          )}]
                          I want you to choose the string which fit best with the theme or topic: ${topic} and just return this string.
                          Your response must be just and only the string that you choose. For example: If you choose the string "abcde" you must send me back only: "abcde" and that is all`,
                    },
                  ],
                });
                const mediaSelectedJSON =
                  mediaSelectedString.data.choices[0].message?.content || "";
                return medias.find((pM) => pM.title === mediaSelectedJSON);
              } catch (error) {
                console.log(error);
              }
            })
          );
          const mediasFiltered = allMedias.filter(
            (media) =>
              media?.place.address.coordinates.lat &&
              media?.place.address.coordinates.lng
          );
          const coordinates = mediasFiltered
            .map(
              (m) =>
                m && [
                  m.place.address.coordinates.lng,
                  m.place.address.coordinates.lat,
                ]
            )
            .filter(Boolean) as [number, number][];
          const tripData = await getTrip("foot", coordinates);
          const routeData = await getRoute("foot", coordinates);
          const stops = mediasFiltered.map((media, index) => {
            return {
              media,
              order: index,
              optimizedOrder: tripData.waypoints[index].waypoint_index,
            };
          });
          const cities = stops
            .map((stop) => stop?.media?.place.address.city)
            .reduce<{ [key: string]: number }>((acc, str) => {
              acc[str || ""] = (acc[str || ""] || 0) + 1;
              return acc;
            }, {});

          const mostImportantCity = Object.keys(cities).reduce((a, b) =>
            cities[a] > cities[b] ? a : b
          );

          let city = await MongoCityModel.findOne({
            "translations.en": mostImportantCity,
          });
          let newCity;
          if (!city) {
            newCity = await CreateCityByEnglishNameUseCase(mostImportantCity);
          }

          return MongoRouteModel.create({
            title: route.title,
            description: route.description,
            stops,
            rating: route.rating,
            duration: routeData.routes[0].duration,
            optimizedDuration: tripData.trips[0].duration,
            distance: routeData.routes[0].distance,
            optimizedDistance: tripData.trips[0].distance,
            cityId: city ? city._id : newCity?._id,
            language: "en-US",
          });
        }
      })
    );
  } catch (error) {
    console.log("Error", error);
    throw error;
  }
}
