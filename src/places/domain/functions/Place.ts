import { listAllPhotos } from "../../infrastructure/s3/photos";
import { IPlace, IPlaceTranslated } from "../../domain/interfaces/IPlace";
import { ImageSize } from "../../domain/types/ImageTypes";

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
      : undefined,
    photos: await listAllPhotos(
      "monum-place-photos",
      `places/${place.googleId}`,
      imageSize
    ),
    mainPhoto: place.mainPhoto?.sizes[imageSize],
  };
}
