import { MongoPlaceModel } from "../infrastructure/mongoModel/MongoPlaceModel.js";
import { IPlace, IPlaceTranslated } from "../domain/interfaces/IPlace.js";

export default async function GetPlacesFullUseCase(
  textSearch?: string
): Promise<IPlace[]> {
  const query = {
    deleted: { $ne: true },
    $or: [
      { name: { $regex: textSearch || "", $options: "i" } },
      {
        $expr: {
          $gt: [
            {
              $size: {
                $filter: {
                  input: { $objectToArray: "$nameTranslations" },
                  cond: {
                    $regexMatch: {
                      input: "$$this.v",
                      regex: textSearch || "",
                      options: "i",
                    },
                  },
                },
              },
            },
            0,
          ],
        },
      },
    ],
  };
  return MongoPlaceModel.find(query);
}
