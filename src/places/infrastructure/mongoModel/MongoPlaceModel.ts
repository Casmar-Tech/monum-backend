import { Model, model, Schema, Types } from "mongoose";
import { IPlace, IPlaceSimplified } from "../../domain/interfaces/IPlace.js";

const Photo = {
  id: String,
  url: String,
  width: Number,
  height: Number,
};

interface IPlaceMethods {
  getSimplifiedVersion: (language: string) => IPlaceSimplified;
}

type PlaceModel = Model<IPlace, {}, IPlaceMethods>;

export const PlaceSchema = new Schema<IPlace, PlaceModel, IPlaceMethods>({
  name: { type: String, required: true, unique: true },
  nameTranslations: {
    type: Map,
    of: String,
    required: true,
  },
  address: {
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    street: {
      type: Map,
      of: String,
    },
    city: {
      type: Map,
      of: String,
      required: true,
    },
    postalCode: { type: String },
    province: {
      type: Map,
      of: String,
    },
    country: {
      type: Map,
      of: String,
      required: true,
    },
  },
  description: {
    type: Map,
    of: String,
    required: true,
  },
  importance: { type: Number, required: true },
  photos: { type: [Photo] },
  rating: { type: Number },
});

PlaceSchema.method(
  "getSimplifiedVersion",
  function (language: string): IPlaceSimplified {
    const getTranslation = (translations: { [key: string]: string }) =>
      translations[language] || "";

    return {
      id: this.id,
      name: getTranslation(this.nameTranslations),
      address: {
        coordinates: {
          lat: this.address.coordinates.lat,
          lng: this.address.coordinates.lng,
        },
        postalCode: this.address.postalCode,
        street: getTranslation(this.address.street || {}),
        city: getTranslation(this.address.city),
        province: getTranslation(this.address.province || {}),
        country: getTranslation(this.address.country),
      },
      description: getTranslation(this.description),
      importance: this.importance,
      rating: this.rating,
      photos: this.photos,
    };
  }
);

export async function createPlaceFromSimplePlace(
  place: IPlaceSimplified,
  language: string
) {
  return await MongoPlaceModel.create({
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
    importance: place.importance,
    photos: place.photos,
    rating: place.rating,
  });
}

export const MongoPlaceModel = model("places-news", PlaceSchema);
