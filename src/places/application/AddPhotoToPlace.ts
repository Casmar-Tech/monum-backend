import "../../connection.js";
import { Types } from "mongoose";
import sharp from "sharp";
import { MongoPlaceModel } from "../infrastructure/mongoModel/MongoPlaceModel.js";
import {
  LARGE_PHOTO_MAX_WIDTH_PX,
  MEDIUM_PHOTO_MAX_WIDTH_PX,
  ORIGINAL_PHOTO_MAX_WIDTH_PX,
  SMALL_PHOTO_MAX_WIDTH_PX,
} from "../infrastructure/s3/photos.js";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { DeleteAllPhotosOfAPlace } from "./DeleteAllPhotosOfAPlace.js";

const s3 = new S3Client({
  region: "eu-west-1",
});

const bucketName = process.env.S3_BUCKET_PLACES_IMAGES!;

async function AddImageToPlace(
  placeId: string,
  photoUrl: string,
  isMainPhoto: boolean
): Promise<void> {
  const place = await MongoPlaceModel.findById(placeId);
  if (!place) {
    throw new Error("Place not found");
  }
  const photoFetch = await fetch(photoUrl);
  const photoBuffer = await photoFetch.arrayBuffer();

  const id = new Types.ObjectId();

  const commonKey = `places/${placeId}/${id}`;

  const metadata = await sharp(photoBuffer).metadata();
  if (!metadata || !metadata.width || !metadata.height) {
    throw new Error("Error getting metadata from photo");
  }

  let photoDocument = {
    url: commonKey,
    width: metadata.width,
    height: metadata.height,
    sizes: {},
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

  if (photoDocument) {
    if (isMainPhoto) {
      place.mainPhoto = photoDocument;
    } else {
      Array.isArray(place.photos) && place.photos.push(photoDocument);
    }
  }
  await place.save();
}

async function AddMultipleImagesToPlace(
  placeId: string,
  photoUrls: string[],
  deleteOldPhotos = false
): Promise<void> {
  let index = 0;
  if (deleteOldPhotos) {
    await DeleteAllPhotosOfAPlace(placeId);
  }
  for (const photoUrl of photoUrls) {
    console.log(`Adding photo ${index + 1} of ${photoUrls.length}`);
    index === 0
      ? await AddImageToPlace(placeId, photoUrl, true)
      : await AddImageToPlace(placeId, photoUrl, false);
    index++;
  }
}

// AddMultipleImagesToPlace(
//   "65bc06e0073d78313963e72a",
//   [
//     "https://images.pexels.com/photos/819764/pexels-photo-819764.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
//     "https://images.pexels.com/photos/11328998/pexels-photo-11328998.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
//     "https://images.pexels.com/photos/14576258/pexels-photo-14576258.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
//     "https://images.pexels.com/photos/18506409/pexels-photo-18506409/free-photo-of-punto-de-referencia-iglesia-monumento-espana.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
//     "https://images.pexels.com/photos/11920332/pexels-photo-11920332.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
//   ],
//   true
// );

// AddImageToPlace(
//   "65b9605e89e8eac1f381b784",
//   "https://images.pexels.com/photos/7639454/pexels-photo-7639454.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
//   true
// );
