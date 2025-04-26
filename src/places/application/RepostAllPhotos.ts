import { Types } from "mongoose";
import "../../connection.js";
import { MongoPlaceModel } from "../infrastructure/mongoModel/MongoPlaceModel.js";
import { ListObjectsCommand, S3Client } from "@aws-sdk/client-s3";
import IPhoto from "../domain/interfaces/IPhoto.js";

const s3 = new S3Client({
  region: "eu-west-1",
});

const bucketName = process.env.S3_BUCKET_PLACES_IMAGES!;

async function RepostImagesToPlace(placeId: string): Promise<void> {
  const place = await MongoPlaceModel.findById(placeId);
  if (!place) {
    throw new Error("Place not found");
  }

  const listObjectCommandCheck = new ListObjectsCommand({
    Bucket: bucketName,
    Prefix: `places/${placeId}`,
  });
  const dataCheck = await s3.send(listObjectCommandCheck);
  if (!dataCheck || !dataCheck.Contents || dataCheck.Contents?.length === 0) {
    return;
  }

  const photoArray = dataCheck.Contents?.map((photo) => photo.Key);
  if (!photoArray || photoArray.length === 0) {
    return;
  }

  const photosIds = Array.from(
    new Set(
      photoArray.map((photo) => {
        if (!photo) {
          return null;
        }
        const parts = photo.split("/");
        return parts[2];
      })
    )
  ).filter((photoId) => photoId);

  if (photosIds.length === 0) {
    return;
  }

  const photoArrayFiltered = photosIds.map((photoId: any) => {
    const photos = photoArray
      .filter((photo) => {
        if (!photo) {
          return false;
        }
        return photo.includes(photoId);
      })
      .filter((photo) => photo);
    if (photos.length === 0) {
      return null;
    }
    const small = photos.find((photo: any) => photo.includes("small"));
    const medium = photos.find((photo: any) => photo.includes("medium"));
    const large = photos.find((photo: any) => photo.includes("large"));
    const original = photos.find((photo: any) => photo.includes("original"));
    return {
      id: photoId,
      url: original,
      sizes: {
        original,
        small,
        medium,
        large,
      },
    };
  });

  place.photos = photoArrayFiltered.map((photo, index) => {
    if (!photo) {
      return null;
    }
    return {
      url: photo.url || "",
      sizes: {
        original: photo.sizes.original || "",
        small: photo.sizes.small || "",
        medium: photo.sizes.medium || "",
        large: photo.sizes.large || "",
      },
      width: 0,
      height: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: new Types.ObjectId("650b0ef881d58ebbb22daf04"),
      order: index,
      _id: new Types.ObjectId(photo.id),
    };
  }) as IPhoto[];

  // for (const photoId in photosGrouped) {
  //   if (!photoId) {
  //     continue;
  //   }
  //   const photo = photosGrouped[photoId];
  //   place.photos.push({
  //     url: photo.url,
  //     sizes: {
  //       original: photo.sizes.original,
  //       small: photo.sizes.small,
  //       medium: photo.sizes.medium,
  //       large: photo.sizes.large,
  //     },
  //     width: 0,
  //     height: 0,
  //     createdAt: new Date(),
  //     updatedAt: new Date(),
  //     createdBy: new Types.ObjectId("650b0ef881d58ebbb22daf04"),
  //     order: 0,
  //   });
  // }

  await place.save();
}

async function RepostImagesToPlaces(): Promise<void> {
  const places = await MongoPlaceModel.find({
    $and: [{ "photos.0": { $exists: true } }, { deleted: { $ne: true } }],
  });
  const placeSliced = places;
  let index = 0;
  for (const place of placeSliced) {
    await RepostImagesToPlace(place._id.toString());
    index++;
    console.log(`Place ${index} of ${places.length}`);
  }
}
RepostImagesToPlaces();
