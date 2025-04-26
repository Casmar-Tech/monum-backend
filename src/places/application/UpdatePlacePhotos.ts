import { ApolloError } from "apollo-server-errors";
import { Types } from "mongoose";
import sharp from "sharp";
import "../../connection.js";
import { MongoPlaceModel } from "../infrastructure/mongoModel/MongoPlaceModel.js";
import GetUserByIdUseCase from "../../users/application/GetUserByIdUseCase.js";
import {
  NewPhotosUpdateInput,
  OldPhotosUpdateInput,
} from "../infrastructure/graphql/resolvers.js";
import { ImageWidths } from "../domain/types/ImageTypes.js";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import IPhoto from "../domain/interfaces/IPhoto.js";

const s3 = new S3Client({
  region: "eu-west-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID_MONUM!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_MONUM!,
  },
});

const bucketName = process.env.S3_BUCKET_PLACES_IMAGES!;

const {
  LARGE_PHOTO_MAX_WIDTH_PX,
  MEDIUM_PHOTO_MAX_WIDTH_PX,
  ORIGINAL_PHOTO_MAX_WIDTH_PX,
  SMALL_PHOTO_MAX_WIDTH_PX,
} = ImageWidths;

function cleanBase64(base64String: string) {
  const base64Pattern = /^data:image\/\w+;base64,/;
  if (base64Pattern.test(base64String)) {
    return base64String.split(",")[1];
  }
  return base64String;
}

async function AddPhotoBase64ToS3(
  placeId: string,
  photoBase64: string,
  photoName: string,
  order: number,
  userId: string
): Promise<IPhoto> {
  const cleanBase64String = cleanBase64(photoBase64);
  const photoBuffer = Buffer.from(cleanBase64String, "base64");

  const id = new Types.ObjectId();

  const commonKey = `places/${placeId}/${id}`;

  let photoDocument: IPhoto = {
    url: commonKey,
    sizes: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: new Types.ObjectId(userId),
    order: order,
    name: photoName,
  };

  for (const size of ["original", "small", "medium", "large"]) {
    let width = 0;
    switch (size) {
      case "small":
        width = SMALL_PHOTO_MAX_WIDTH_PX;
        break;
      case "medium":
        width = MEDIUM_PHOTO_MAX_WIDTH_PX;
        break;
      case "large":
        width = LARGE_PHOTO_MAX_WIDTH_PX;
        break;
      case "original":
        width = ORIGINAL_PHOTO_MAX_WIDTH_PX;
        break;
    }

    const imageResized = sharp(photoBuffer).resize(width).webp();
    const buffer = await imageResized.toBuffer();

    const objectKey = `${commonKey}/${size}.webp`;

    const bucketParams = {
      Bucket: bucketName,
      Key: objectKey,
      Body: buffer,
    };

    await s3.send(new PutObjectCommand(bucketParams));

    console.log(`Photo for place ${placeId} with size ${size} added to S3`);

    photoDocument.sizes[size] = objectKey;
  }

  return photoDocument;
}

export default async function UpdatePlacePhotos(
  userId: string,
  id: string,
  oldPhotos: OldPhotosUpdateInput[],
  newPhotos: NewPhotosUpdateInput[]
): Promise<boolean> {
  const user = await GetUserByIdUseCase(userId);
  if (!user) {
    throw new ApolloError("User not found", "USER_NOT_FOUND");
  }
  const placeToUpdate = await MongoPlaceModel.findById(id);
  if (!placeToUpdate) {
    throw new ApolloError("Place not found", "PLACE_NOT_FOUND");
  }
  placeToUpdate.photos = placeToUpdate.photos || [];

  placeToUpdate.photos.forEach((photo) => {
    const oldPhotosFound = oldPhotos.find(
      (oldPhoto) => oldPhoto.id === photo.id
    );
    if (!oldPhotosFound) {
      photo.updatedAt = new Date();
      photo.deleteBy = user._id;
      photo.deletedAt = new Date();
      photo.order = undefined;
    } else {
      photo.updatedAt = new Date();
      photo.order = oldPhotosFound?.order;
      photo.deleteBy = undefined;
      photo.deletedAt = undefined;
    }
  });

  for (const newPhoto of newPhotos) {
    const newPhotoDocument = await AddPhotoBase64ToS3(
      id,
      newPhoto.photoBase64,
      newPhoto.name,
      newPhoto.order,
      userId
    );
    placeToUpdate.photos.push(newPhotoDocument);
  }

  placeToUpdate.markModified("photos");
  await placeToUpdate.save();

  return true;
}
