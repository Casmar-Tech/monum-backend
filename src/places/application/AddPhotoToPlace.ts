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

  const commonKey = `places/${place.googleId || placeId}/${id}`;

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

    const imageResized = sharp(photoBuffer).resize(width).jpeg();
    const buffer = await imageResized.toBuffer();

    const objectKey = `${commonKey}/${size}.jpeg`;

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
//   "65c36a662aa965fbc7905944",
//   [
//     "https://4.bp.blogspot.com/-qWVXYHanydg/Ul8CiBW0BHI/AAAAAAAAATg/OkpHhEkNCrc/s1600/IMG_2034.JPG",
//     "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/18/46/70/91/pujada-de-sant-domenec.jpg?w=1200&h=-1&s=1",
//     "https://live.staticflickr.com/5057/5486234301_7ded2ece9d_b.jpg",
//     "https://i2.wp.com/funitopic.es/wp-content/uploads/2017/09/La-pujada-Ingrid-Llorens-e1506789632606.jpg?fit=900%2C603&ssl=1",
//     "https://i0.wp.com/xn--lacompaialibredebraavos-yhc.com/wp-content/uploads/2018/07/sant-dom%C3%A8nec-por-Dani-Oliver1.jpg?resize=1500%2C1004&ssl=1",
//   ],
//   true
// );

// AddImageToPlace(
//   "65b9605e89e8eac1f381b784",
//   "https://images.pexels.com/photos/7639454/pexels-photo-7639454.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
//   true
// );
