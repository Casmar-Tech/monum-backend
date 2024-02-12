import { model, Schema } from "mongoose";
import { IPlace, IPlaceTranslated } from "../../domain/interfaces/IPlace.js";
import IPhoto from "../../domain/interfaces/IPhoto.js";
import { listAllPhotos } from "../s3/photos.js";
import { ImageSize } from "../../domain/types/ImageTypes.js";

export const Photo = new Schema<IPhoto>({
  url: { type: String, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  sizes: {
    type: Object,
    of: String,
    required: true,
  },
});

export const PlaceSchema = new Schema<IPlace>(
  {
    name: { type: String, required: true, unique: true },
    nameTranslations: {
      type: Object,
      of: String,
      required: true,
    },
    address: {
      coordinates: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
      },
      street: {
        type: Object,
        of: String,
      },
      city: {
        type: Object,
        of: String,
        required: true,
      },
      postalCode: { type: String },
      province: {
        type: Object,
        of: String,
      },
      country: {
        type: Object,
        of: String,
        required: true,
      },
    },
    description: {
      type: Object,
      of: String,
      required: true,
    },
    importance: { type: Number, required: true },
    photos: { type: [Photo] },
    mainPhoto: { type: Photo },
    rating: { type: Number },
    googleId: { type: String, unique: true },
    googleMapsUri: { type: String },
    internationalPhoneNumber: { type: String },
    nationalPhoneNumber: { type: String },
    types: { type: [String], required: true },
    primaryType: { type: String },
    userRatingCount: { type: Number },
    websiteUri: { type: String },
  },
  { timestamps: true }
);

PlaceSchema.method(
  "getTranslatedVersion",
  async function (
    language: string,
    imageSize?: ImageSize
  ): Promise<IPlaceTranslated> {
    const getTranslation = (translations: { [key: string]: string }) => {
      // Try to get the translation for the language
      if (translations[language]) {
        return translations[language];
      }
      // If the translation for the language is not available, get the first one
      const anyTranslation = Object.values(translations)[0] || "";
      return anyTranslation;
    };

    return {
      ...this.toObject(),
      id: this._id.toString(),
      name: getTranslation(this.nameTranslations),
      address: {
        coordinates: {
          lat: this.address.coordinates.lat,
          lng: this.address.coordinates.lng,
        },
        postalCode: this.address.postalCode,
        street: this.address.street && getTranslation(this.address.street),
        city: this.address.city && getTranslation(this.address.city),
        province:
          this.address.province && getTranslation(this.address.province),
        country: this.address.country && getTranslation(this.address.country),
      },
      description: this.description && getTranslation(this.description),
      photos: await listAllPhotos(
        "monum-place-photos",
        `places/${this.googleId}`,
        imageSize || "original"
      ),
      mainPhoto: this.mainPhoto?.sizes[imageSize || "original"],
    };
  }
);

export async function createPlaceFromTranslatedPlace(
  place: IPlaceTranslated,
  language: string
) {
  // Verify if the place already exists
  const existingPlace = await MongoPlaceModel.findOne({ name: place.name });

  if (existingPlace) {
    // If the place already exists, update the translations
    return existingPlace;
  }
  return await MongoPlaceModel.create({
    ...place,
    name: place.name,
    nameTranslations: {
      [language]: place.name,
    },
    address: {
      coordinates: {
        lat: place.address.coordinates.lat,
        lng: place.address.coordinates.lng,
      },
      street: {
        [language]: place.address.street,
      },
      city: {
        [language]: place.address.city,
      },
      postalCode: place.address.postalCode,
      province: {
        [language]: place.address.province,
      },
      country: {
        [language]: place.address.country,
      },
    },
    description: {
      [language]: place.description,
    },
  });
}

export const MongoPlaceModel = model("places", PlaceSchema);
