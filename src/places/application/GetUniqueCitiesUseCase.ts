import { MongoPlaceModel } from "../infrastructure/mongoModel/MongoPlaceModel.js";
import { IPlace } from "../domain/interfaces/IPlace.js";
import { MongoUserModel } from "../../users/infrastructure/mongoModel/MongoUserModel.js";
/**
 * Get unique cities from all places in the database or filter by a text search.
 * @param {string} [userId] - UserId to get the La.
 * @param {string} [textSearch] - Optional text to filter cities by.
 * @returns {Promise<string[]>} - A promise that resolves to an array of unique city names.
 */
export default async function GetUniqueCitiesUseCase(
  userId: string,
  textSearch?: string
): Promise<IPlace[]> {
  try {
    const user = await MongoUserModel.findById(userId);
    if (!user) {
      throw new Error("User not found.");
    }
    const userLanguage = user.language || "en_US";

    const matchStage = textSearch
      ? {
          $match: {
            [`address.city.${userLanguage}`]: {
              $regex: textSearch, // Match cities containing the textSearch string
              $options: "i", // Case-insensitive
            },
            deleted: { $ne: true }, // Exclude deleted places
          },
        }
      : {
          $match: {
            deleted: { $ne: true }, // Exclude deleted places
          },
        };

    const pipeline = [
      ...(matchStage ? [matchStage] : []),
      {
        $project: {
          // Extract only the user's preferred language translations
          city: `$address.city.${userLanguage}`,
        },
      },
      {
        $group: {
          _id: null, // Group all cities together
          uniqueCities: { $addToSet: "$city" }, // Collect unique city names
        },
      },
      {
        $project: {
          _id: 0, // Exclude the _id field
          uniqueCities: 1, // Include only the uniqueCities field
        },
      },
    ];

    const result = await MongoPlaceModel.aggregate(pipeline);

    return result.length > 0 ? result[0].uniqueCities : [];
  } catch (error) {
    console.error("Error fetching unique cities:", error);
    throw new Error("Unable to fetch unique cities.");
  }
}
