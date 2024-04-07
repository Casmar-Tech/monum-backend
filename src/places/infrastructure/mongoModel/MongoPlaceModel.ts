import { model, Schema } from "mongoose";
import { IPlace, IPlaceTranslated } from "../../domain/interfaces/IPlace.js";
import IPhoto from "../../domain/interfaces/IPhoto.js";

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
        type: { type: String, enum: ["Point"], required: true },
        coordinates: {
          type: [Number],
          required: true,
        },
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
    deleted: {
      type: Boolean,
      required: false,
      default: false,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "users", required: true },
  },

  { timestamps: true }
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
      coordinates: place.address.coordinates,
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

PlaceSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

PlaceSchema.set("toJSON", { virtuals: true });
PlaceSchema.set("toObject", { virtuals: true });
PlaceSchema.index({ "address.coordinates": "2dsphere" });

export const MongoPlaceModel = model("places-news", PlaceSchema);
