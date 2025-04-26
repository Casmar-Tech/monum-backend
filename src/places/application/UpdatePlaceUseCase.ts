import { ApolloError } from "apollo-server-errors";
import { IPlace, IPlaceTranslated } from "../domain/interfaces/IPlace.js";
import { MongoPlaceModel } from "../infrastructure/mongoModel/MongoPlaceModel.js";
import GetUserByIdUseCase from "../../users/application/GetUserByIdUseCase.js";
import { getTranslatedPlace } from "../domain/functions/Place.js";
import { IPlaceInput } from "../infrastructure/graphql/resolvers.js";

export default async function UpdatePlaceUseCase(
  userId: string,
  placeId: string,
  placeUpdate: Partial<IPlaceInput>
): Promise<IPlaceTranslated> {
  const user = await GetUserByIdUseCase(userId);
  const originalPlace = await MongoPlaceModel.findById(placeId);
  if (!originalPlace) {
    throw new ApolloError("Place not found", "PLACE_NOT_FOUND");
  }
  const language = user.language;
  const newCoordinates = placeUpdate.address?.coordinates;
  const placeUpdateWithTranslations = {
    ...placeUpdate,
    nameTranslations: {
      ...originalPlace.nameTranslations,
      [language]: placeUpdate.name,
    },
    description: {
      ...originalPlace.nameTranslations,
      [language]: placeUpdate.description,
    },
    address: {
      ...placeUpdate.address,
      street: {
        ...originalPlace.address.street,
        [language]: placeUpdate.address?.street,
      },
      city: {
        ...originalPlace.address.city,
        [language]: placeUpdate.address?.city,
      },
      country: {
        ...originalPlace.address.country,
        [language]: placeUpdate.address?.country,
      },
      province: {
        ...originalPlace.address.province,
        [language]: placeUpdate.address?.province,
      },
      coordinates: {
        type: "Point",
        coordinates:
          newCoordinates?.lat && newCoordinates?.lng
            ? [newCoordinates?.lng, newCoordinates.lat]
            : originalPlace.address.coordinates,
      },
    },
  };

  const placeUpdated = await MongoPlaceModel.findByIdAndUpdate(
    placeId,
    placeUpdateWithTranslations,
    { new: true }
  );
  if (placeUpdated) {
    return getTranslatedPlace(placeUpdated, user.language);
  }
  throw new ApolloError("Place not found", "PLACE_NOT_FOUND");
}
