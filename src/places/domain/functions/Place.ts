import { IPlace, IPlaceTranslated } from "../../domain/interfaces/IPlace.js";
import { ImageSize } from "../../domain/types/ImageTypes.js";
import { IPhotoExisting } from "../interfaces/IPhoto.js";

const getTranslation = (
  translations: { [key: string]: string },
  language: string
): string => {
  return translations[language] || Object.values(translations)[0] || "";
};

export function getTranslatedPlace(
  place: IPlace,
  language: string,
  imageSize?: ImageSize
): IPlaceTranslated {
  const placePhotosFiltered = Array.isArray(place.photos)
    ? (place.photos.filter(
        (photo) =>
          photo.order !== undefined &&
          photo.order !== null &&
          photo.order !== -1 &&
          typeof photo.order === "number" &&
          photo.deleteBy === undefined &&
          photo.deletedAt === undefined
      ) as IPhotoExisting[])
    : ([] as IPhotoExisting[]);

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
    photos: placePhotosFiltered,
    imagesUrl: placePhotosFiltered
      ? placePhotosFiltered
          .sort((a, b) => a.order - b.order)
          .map((photo) => {
            return photo.sizes[imageSize || "medium"];
          })
      : [],
  };
}
