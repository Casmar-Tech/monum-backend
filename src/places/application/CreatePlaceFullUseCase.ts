import { IPlace } from "../domain/interfaces/IPlace.js";
import { MongoPlaceModel } from "../infrastructure/mongoModel/MongoPlaceModel.js";
import { PlaceFullInput } from "../infrastructure/graphql/resolvers.js";
import { Languages } from "../../shared/Types.js";

export default async function CreatePlaceUseCase(
  userId: string,
  place: PlaceFullInput
): Promise<IPlace> {
  const arrayToObjectLanguage = (array: any[]) =>
    array.reduce((obj, item) => {
      obj[item.key as Languages] = item.value;
      return obj;
    }, {} as { [key in Languages]: string });
  const newPlaceModel = new MongoPlaceModel({
    ...place,
    nameTranslations: arrayToObjectLanguage(place.nameTranslations),
    description: arrayToObjectLanguage(place.description),
    address: {
      street: arrayToObjectLanguage(place.address.street),
      city: arrayToObjectLanguage(place.address.city),
      country: arrayToObjectLanguage(place.address.country),
      province: arrayToObjectLanguage(place.address.province),
      coordinates: {
        type: "Point",
        coordinates: [
          place.address.coordinates.lng,
          place.address.coordinates.lat,
        ],
      },
    },
    createdBy: userId,
  });

  return newPlaceModel.save();
}
