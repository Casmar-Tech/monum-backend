import "../../connection.js";
import { MongoPlaceModel } from "../../places/infrastructure/mongoModel/MongoPlaceModel.js";
import PopulateMediaByTopic from "../application/PopulateMediaByTopic.js";
import { MongoMediaTopicModel } from "../infrastructure/mongoModel/MongoMediaTopicModel.js";

async function main() {
  let places = await MongoPlaceModel.aggregate([
    {
      $match: {
        importance: { $eq: 8 },
        deleted: { $ne: true },
      },
    },
    {
      $lookup: {
        from: "medias-news", // Asegúrate de que el nombre de la colección es correcto
        localField: "_id",
        foreignField: "placeId",
        as: "mediaDocs",
      },
    },
    {
      $project: {
        _id: 1,
        name: 1, // Incluye otros campos del place que necesites
        mediaCount: { $size: "$mediaDocs" },
        mediaTopics: {
          $map: {
            input: "$mediaDocs",
            as: "media",
            in: { $toString: "$$media.topicId" },
          },
        },
      },
    },
  ]);
  const allMediaTopics = await MongoMediaTopicModel.find();
  await Promise.all(
    places.map(async (place) => {
      await Promise.all(
        allMediaTopics.map(async (topic) => {
          if (place.mediaTopics.includes(topic._id.toString())) return;
          await PopulateMediaByTopic(place._id, topic);
        })
      );
    })
  );

  console.log("Done!");
}

main();
