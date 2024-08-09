import { ApolloError } from "apollo-server-errors";
import { IPlace } from "../domain/interfaces/IPlace";
import { PlaceFullInput } from "../infrastructure/graphql/resolvers";
import { MongoPlaceModel } from "../infrastructure/mongoModel/MongoPlaceModel.js";
import { Languages } from "../../shared/Types";

export default async function UpdatePlaceFullUseCase(
  id: string,
  placeUpdate: Partial<PlaceFullInput>
): Promise<IPlace> {
  const arrayToObjectLanguage = (array: any[]) =>
    array.reduce((obj, item) => {
      obj[item.key as Languages] = item.value;
      return obj;
    }, {} as { [key in Languages]: string });
  const place = await MongoPlaceModel.findById(id);
  if (!place) {
    throw new ApolloError("Place not found", "PLACE_NOT_FOUND");
  }
  if (placeUpdate.nameTranslations) {
    place.nameTranslations = arrayToObjectLanguage(
      placeUpdate.nameTranslations
    );
  }
  if (placeUpdate.description) {
    place.description = arrayToObjectLanguage(placeUpdate.description);
  }
  if (
    typeof placeUpdate?.importance === "number" &&
    placeUpdate.importance >= 1 &&
    placeUpdate.importance <= 3
  ) {
    place.importance = placeUpdate.importance;
  }
  if (placeUpdate.address) {
    place.address = {
      ...place.address,
      street: arrayToObjectLanguage(placeUpdate.address.street),
      city: arrayToObjectLanguage(placeUpdate.address.city),
      country: arrayToObjectLanguage(placeUpdate.address.country),
      province: arrayToObjectLanguage(placeUpdate.address.province),
      coordinates: {
        type: "Point",
        coordinates: [
          placeUpdate.address.coordinates.lng,
          placeUpdate.address.coordinates.lat,
        ],
      },
    };
  }
  return await place.save();
}
