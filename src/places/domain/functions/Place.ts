import { listAllPhotos } from "../../infrastructure/s3/photos.js";
import { IPlace, IPlaceTranslated } from "../../domain/interfaces/IPlace.js";
import { ImageSize } from "../../domain/types/ImageTypes.js";

const getTranslation = (
  translations: { [key: string]: string },
  language: string
): string => {
  return translations[language] || Object.values(translations)[0] || "";
};

export async function getTranslatedPlace(
  place: IPlace,
  language: string,
  imageSize: ImageSize = "original"
): Promise<IPlaceTranslated> {
  return {
    ...place,
    id: place?._id?.toString() || "",
    name: getTranslation(place.nameTranslations, language),
    address: {
      coordinates: place.address.coordinates,
      postalCode: place.address.postalCode,
      street: place.address.street
        ? getTranslation(place.address.street, language)
        : undefined,
      city: place.address.city
        ? getTranslation(place.address.city, language)
        : "",
      province: place.address.province
        ? getTranslation(place.address.province, language)
        : undefined,
      country: place.address.country
        ? getTranslation(place.address.country, language)
        : "",
    },
    description: place.description
      ? getTranslation(place.description, language)
      : "",
    photos: place.mainPhoto
      ? await listAllPhotos(
          `places/${place.googleId || place._id?.toString()}`,
          imageSize
        )
      : [],
    mainPhoto: place.mainPhoto?.sizes[imageSize],
  };
}
